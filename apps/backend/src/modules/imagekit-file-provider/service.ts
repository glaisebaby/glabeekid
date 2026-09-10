import { PassThrough, Readable, Writable } from "node:stream"
import {
  AbstractFileProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { FileTypes } from "@medusajs/framework/types"

type ImageKitOptions = {
  private_key?: string
  url_endpoint?: string
  folder?: string
}

type ImageKitUploadResponse = {
  fileId: string
  filePath: string
  url: string
}

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload"
const IMAGEKIT_DELETE_URL = "https://api.imagekit.io/v1/files"

const encodeKey = (fileId: string, filePath: string) =>
  `${fileId}|${filePath}`

const decodeKey = (key: string) => {
  const separatorIndex = key.indexOf("|")

  if (separatorIndex === -1) {
    return {
      fileId: key,
      filePath: "",
    }
  }

  return {
    fileId: key.slice(0, separatorIndex),
    filePath: key.slice(separatorIndex + 1),
  }
}

const decodeUploadContent = (content: string, mimeType?: string) => {
  const decodedBase64 = Buffer.from(content, "base64")

  if (decodedBase64.toString("base64") === content) {
    return decodedBase64
  }

  const isTextContent =
    mimeType?.startsWith("text/") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("json") ||
    mimeType?.includes("xml")

  return isTextContent ? Buffer.from(content, "utf8") : Buffer.from(content, "binary")
}

export class ImageKitFileProviderService extends AbstractFileProviderService {
  static identifier = "imagekit"

  protected privateKey_: string
  protected urlEndpoint_: string
  protected folder_: string

  constructor(_: unknown, options: ImageKitOptions) {
    super()

    if (!options.private_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "ImageKit private key is required."
      )
    }

    if (!options.url_endpoint) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "ImageKit URL endpoint is required."
      )
    }

    this.privateKey_ = options.private_key
    this.urlEndpoint_ = options.url_endpoint.replace(/\/$/, "")
    this.folder_ = options.folder || "/products"
  }

  protected getAuthHeader() {
    return `Basic ${Buffer.from(`${this.privateKey_}:`).toString("base64")}`
  }

  protected getFileUrl(filePath: string) {
    const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`

    return `${this.urlEndpoint_}${normalizedPath}`
  }

  protected async uploadBuffer({
    filename,
    mimeType,
    content,
  }: {
    filename: string
    mimeType: string
    content: Buffer
  }): Promise<FileTypes.ProviderFileResultDTO> {
    const form = new FormData()
    form.append("file", content.toString("base64"))
    form.append("fileName", filename)
    form.append("folder", this.folder_)
    form.append("useUniqueFileName", "true")

    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
      },
      body: form,
    })

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText)

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `ImageKit upload failed with status ${response.status}: ${message}`
      )
    }

    const uploaded = (await response.json()) as ImageKitUploadResponse

    return {
      key: encodeKey(uploaded.fileId, uploaded.filePath),
      url: uploaded.url || this.getFileUrl(uploaded.filePath),
    }
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file?.filename) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No filename provided."
      )
    }

    return this.uploadBuffer({
      filename: file.filename,
      mimeType: file.mimeType,
      content: decodeUploadContent(file.content, file.mimeType),
    })
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    const fileList = Array.isArray(files) ? files : [files]

    await Promise.all(
      fileList.map(async (file) => {
        const { fileId } = decodeKey(file.fileKey)

        if (!fileId) {
          return
        }

        await fetch(`${IMAGEKIT_DELETE_URL}/${encodeURIComponent(fileId)}`, {
          method: "DELETE",
          headers: {
            Authorization: this.getAuthHeader(),
          },
        })
      })
    )
  }

  async getPresignedDownloadUrl(
    fileData: FileTypes.ProviderGetFileDTO
  ): Promise<string> {
    const { filePath } = decodeKey(fileData.fileKey)

    if (!filePath) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "ImageKit file path is missing from the file key."
      )
    }

    return this.getFileUrl(filePath)
  }

  async getDownloadStream(
    fileData: FileTypes.ProviderGetFileDTO
  ): Promise<Readable> {
    const url = await this.getPresignedDownloadUrl(fileData)
    const response = await fetch(url)

    if (!response.ok || !response.body) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ImageKit file ${fileData.fileKey} was not found.`
      )
    }

    return Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
  }

  async getAsBuffer(fileData: FileTypes.ProviderGetFileDTO): Promise<Buffer> {
    const url = await this.getPresignedDownloadUrl(fileData)
    const response = await fetch(url)

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ImageKit file ${fileData.fileKey} was not found.`
      )
    }

    return Buffer.from(await response.arrayBuffer())
  }

  async getUploadStream(
    fileData: FileTypes.ProviderUploadStreamDTO
  ): Promise<{
    writeStream: Writable
    promise: Promise<FileTypes.ProviderFileResultDTO>
    url: string
    fileKey: string
  }> {
    const chunks: Buffer[] = []
    const writeStream = new PassThrough()
    const placeholderPath = `${this.folder_}/${fileData.filename}`

    writeStream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    const promise = new Promise<FileTypes.ProviderFileResultDTO>(
      (resolve, reject) => {
        writeStream.on("finish", async () => {
          try {
            resolve(
              await this.uploadBuffer({
                filename: fileData.filename,
                mimeType: fileData.mimeType,
                content: Buffer.concat(chunks),
              })
            )
          } catch (error) {
            reject(error)
          }
        })
        writeStream.on("error", reject)
      }
    )

    return {
      writeStream,
      promise,
      url: this.getFileUrl(placeholderPath),
      fileKey: encodeKey("", placeholderPath),
    }
  }
}
