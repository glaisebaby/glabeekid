const fs = require("node:fs")
const path = require("node:path")

const lines = (...items) => items.join("\n")

const targetPathFrom = (root) =>
  path.join(
    root,
    "node_modules",
    "@medusajs",
    "dashboard",
    "src",
    "routes",
    "products",
    "product-media",
    "components",
    "edit-product-media-form",
    "edit-product-media-form.tsx"
  )

const target = [process.cwd(), path.resolve(process.cwd(), "../..")]
  .map(targetPathFrom)
  .find((candidate) => fs.existsSync(candidate))

if (!target) {
  console.log("[patch-medusa-dashboard] Dashboard media editor not found, skipping")
  process.exit(0)
}

let source = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n")

if (source.includes("type UploadProgress = {")) {
  console.log("[patch-medusa-dashboard] Product media upload progress already patched")
  process.exit(0)
}

const replacements = [
  [
    lines(
      "type Media = z.infer<typeof MediaSchema>",
      "",
      "export const EditProductMediaForm = ({ product }: ProductMediaViewProps) => {",
      "  const [selection, setSelection] = useState<Record<string, true>>({})"
    ),
    lines(
      "type Media = z.infer<typeof MediaSchema>",
      "",
      "type UploadProgress = {",
      "  completed: number",
      '  phase: "idle" | "saving" | "uploading"',
      "  total: number",
      "}",
      "",
      "export const EditProductMediaForm = ({ product }: ProductMediaViewProps) => {",
      "  const [selection, setSelection] = useState<Record<string, true>>({})",
      "  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({",
      "    completed: 0,",
      '    phase: "idle",',
      "    total: 0,",
      "  })"
    ),
  ],
  [
    lines(
      "    if (filesToUpload.length) {",
      "      const { files: uploads } = await sdk.admin.upload",
      "        .create({ files: filesToUpload.map((m) => m.file) })",
      "        .catch(() => {",
      '          form.setError("media", {',
      '            type: "invalid_file",',
      '            message: t("products.media.failedToUpload"),',
      "          })",
      "          return { files: [] }",
      "        })",
      "      uploaded = uploads",
      "    }",
      "",
      "    const withUpdatedUrls = media.map((entry, i) => {",
      "      const toUploadIndex = filesToUpload.findIndex((m) => m.index === i)",
      "      if (toUploadIndex > -1) {",
      "        return { ...entry, url: uploaded[toUploadIndex]?.url }",
      "      }",
      "      return entry",
      "    })",
      "",
      "    const thumbnail = withUpdatedUrls.find((m) => m.isThumbnail)?.url",
      "",
      "    await mutateAsync(",
      "      {",
      "        images: withUpdatedUrls.map((file) => ({ url: file.url, id: file.id })),",
      "        thumbnail: thumbnail || null,",
      "      },",
      "      {",
      "        onSuccess: () => {",
      '          toast.success(t("products.media.successToast"))',
      "          handleSuccess()",
      "        },",
      "        onError: (error) => {",
      "          toast.error(error.message)",
      "        },",
      "      }",
      "    )",
      "  })"
    ),
    lines(
      "    try {",
      "      if (filesToUpload.length) {",
      "        setUploadProgress({",
      "          completed: 0,",
      '          phase: "uploading",',
      "          total: filesToUpload.length,",
      "        })",
      "",
      "        for (const [uploadIndex, mediaFile] of filesToUpload.entries()) {",
      "          const { files: uploads } = await sdk.admin.upload",
      "            .create({ files: [mediaFile.file] })",
      "            .catch(() => {",
      '              form.setError("media", {',
      '                type: "invalid_file",',
      '                message: t("products.media.failedToUpload"),',
      "              })",
      "              return { files: [] }",
      "            })",
      "",
      "          if (!uploads.length) {",
      "            return",
      "          }",
      "",
      "          uploaded = [...uploaded, uploads[0]]",
      "          setUploadProgress({",
      "            completed: uploadIndex + 1,",
      '            phase: "uploading",',
      "            total: filesToUpload.length,",
      "          })",
      "        }",
      "",
      "        setUploadProgress({",
      "          completed: filesToUpload.length,",
      '          phase: "saving",',
      "          total: filesToUpload.length,",
      "        })",
      "      }",
      "",
      "      const withUpdatedUrls = media.map((entry, i) => {",
      "        const toUploadIndex = filesToUpload.findIndex((m) => m.index === i)",
      "        if (toUploadIndex > -1) {",
      "          return { ...entry, url: uploaded[toUploadIndex]?.url }",
      "        }",
      "        return entry",
      "      })",
      "",
      "      const thumbnail = withUpdatedUrls.find((m) => m.isThumbnail)?.url",
      "",
      "      if (!filesToUpload.length) {",
      "        setUploadProgress({",
      "          completed: 0,",
      '          phase: "saving",',
      "          total: 0,",
      "        })",
      "      }",
      "",
      "      await mutateAsync(",
      "        {",
      "          images: withUpdatedUrls.map((file) => ({",
      "            url: file.url,",
      "            id: file.id,",
      "          })),",
      "          thumbnail: thumbnail || null,",
      "        },",
      "        {",
      "          onSuccess: () => {",
      '            toast.success(t("products.media.successToast"))',
      "            handleSuccess()",
      "          },",
      "          onError: (error) => {",
      "            toast.error(error.message)",
      "          },",
      "        }",
      "      )",
      "    } finally {",
      "      setUploadProgress({",
      "        completed: 0,",
      '        phase: "idle",',
      "        total: 0,",
      "      })",
      "    }",
      "  })",
      "",
      "  const uploadPercentage =",
      "    uploadProgress.total > 0",
      "      ? Math.round((uploadProgress.completed / uploadProgress.total) * 100)",
      "      : 0",
      "  const showUploadProgress =",
      '    uploadProgress.phase !== "idle" && uploadProgress.total > 0',
      "  const isUploadingOrSaving = showUploadProgress || isPending",
      "  const uploadStatus =",
      '    uploadProgress.phase === "uploading"',
      "      ? `Uploading ${uploadProgress.completed} of ${uploadProgress.total} images`",
      '      : "Saving product media"',
      "  const footerStatus =",
      '    uploadProgress.phase !== "idle" || isPending ? uploadStatus : null'
    ),
  ],
  [
    lines(
      '            <div className="bg-ui-bg-base overflow-auto border-b px-6 py-4 lg:border-b-0 lg:border-l">',
      "              <UploadMediaFormItem form={form} append={append} />"
    ),
    lines(
      '            <div className="bg-ui-bg-base overflow-auto border-b px-6 py-4 lg:border-b-0 lg:border-l">',
      "              {showUploadProgress && (",
      '                <div className="border-ui-border-base bg-ui-bg-subtle mb-4 rounded-lg border p-3">',
      '                  <div className="txt-compact-small-plus text-ui-fg-base flex items-center justify-between">',
      "                    <span>{uploadStatus}</span>",
      "                    <span>{uploadPercentage}%</span>",
      "                  </div>",
      '                  <div className="bg-ui-bg-base mt-2 h-2 overflow-hidden rounded-full">',
      "                    <div",
      '                      className="bg-ui-bg-interactive h-full rounded-full transition-all duration-300"',
      "                      style={{ width: `${uploadPercentage}%` }}",
      "                    />",
      "                  </div>",
      '                  <p className="txt-compact-small text-ui-fg-subtle mt-2">',
      "                    Keep this page open until the save finishes.",
      "                  </p>",
      "                </div>",
      "              )}",
      "              <UploadMediaFormItem form={form} append={append} />"
    ),
  ],
  [
    lines(
      "        <RouteFocusModal.Footer>",
      '          <div className="flex items-center justify-end gap-x-2">',
      "            <RouteFocusModal.Close asChild>",
      '              <Button variant="secondary" size="small">',
      '                {t("actions.cancel")}',
      "              </Button>",
      "            </RouteFocusModal.Close>",
      '            <Button size="small" type="submit" isLoading={isPending}>',
      '              {t("actions.save")}',
      "            </Button>",
      "          </div>",
      "        </RouteFocusModal.Footer>"
    ),
    lines(
      "        <RouteFocusModal.Footer>",
      '          <div className="flex w-full items-center justify-between gap-x-2">',
      '            <div className="txt-compact-small text-ui-fg-subtle">',
      "              {footerStatus}",
      "            </div>",
      '            <div className="flex items-center justify-end gap-x-2">',
      "              <RouteFocusModal.Close asChild>",
      '                <Button variant="secondary" size="small">',
      '                  {t("actions.cancel")}',
      "                </Button>",
      "              </RouteFocusModal.Close>",
      "              <Button",
      '                size="small"',
      '                type="submit"',
      "                isLoading={isUploadingOrSaving}",
      "              >",
      '                {t("actions.save")}',
      "              </Button>",
      "            </div>",
      "          </div>",
      "        </RouteFocusModal.Footer>"
    ),
  ],
]

for (const [before, after] of replacements) {
  if (!source.includes(before)) {
    throw new Error("[patch-medusa-dashboard] Expected dashboard media editor snippet was not found")
  }
  source = source.replace(before, after)
}

fs.writeFileSync(target, source)
console.log("[patch-medusa-dashboard] Product media upload progress patched")
