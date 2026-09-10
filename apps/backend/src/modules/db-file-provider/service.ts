import {
  AbstractFileProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { FileTypes } from "@medusajs/framework/types"
import { PassThrough, Readable, Writable } from "node:stream"

import {
  createDbFileKey,
  decodeUploadContent,
  deleteDbFiles,
  getDbFile,
  getDbFileUrl,
  saveDbFile,
} from "../../lib/db-file-storage"

export class DbFileProviderService extends AbstractFileProviderService {
  static identifier = "db"

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    const key = createDbFileKey(file.filename)

    await saveDbFile({
      key,
      mimeType: file.mimeType,
      content: decodeUploadContent(file.content, file.mimeType),
    })

    return {
      key,
      url: getDbFileUrl(key),
    }
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    const fileList = Array.isArray(files) ? files : [files]

    await deleteDbFiles(fileList.map((file) => file.fileKey))
  }

  async getPresignedDownloadUrl(
    fileData: FileTypes.ProviderGetFileDTO
  ): Promise<string> {
    return getDbFileUrl(fileData.fileKey)
  }

  async getDownloadStream(
    fileData: FileTypes.ProviderGetFileDTO
  ): Promise<Readable> {
    const file = await getDbFile(fileData.fileKey)

    if (!file) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `File with key ${fileData.fileKey} was not found`
      )
    }

    return Readable.from(file.content)
  }

  async getAsBuffer(fileData: FileTypes.ProviderGetFileDTO): Promise<Buffer> {
    const file = await getDbFile(fileData.fileKey)

    if (!file) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `File with key ${fileData.fileKey} was not found`
      )
    }

    return file.content
  }

  async getUploadStream(
    fileData: FileTypes.ProviderUploadStreamDTO
  ): Promise<{
    writeStream: Writable
    promise: Promise<FileTypes.ProviderFileResultDTO>
    url: string
    fileKey: string
  }> {
    const key = createDbFileKey(fileData.filename)
    const chunks: Buffer[] = []
    const writeStream = new PassThrough()

    writeStream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    const promise = new Promise<FileTypes.ProviderFileResultDTO>(
      (resolve, reject) => {
        writeStream.on("finish", async () => {
          try {
            await saveDbFile({
              key,
              mimeType: fileData.mimeType,
              content: Buffer.concat(chunks),
            })

            resolve({
              key,
              url: getDbFileUrl(key),
            })
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
      url: getDbFileUrl(key),
      fileKey: key,
    }
  }

  async getPresignedUploadUrl(
    fileData: FileTypes.ProviderGetPresignedUploadUrlDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    return {
      key: fileData.filename,
      url: "/admin/uploads",
    }
  }
}
