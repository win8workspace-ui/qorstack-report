/**
 * Force-download a file from a URL as a blob, bypassing browser quirks with
 * cross-origin URLs where the `download` attribute is ignored and the file
 * opens in a new tab instead. Fetches the bytes, creates an object URL, and
 * triggers a same-origin download click.
 *
 * Falls back to a direct anchor click if the fetch fails (e.g. CORS blocked).
 */
export const downloadFileFromUrl = async (url: string, fileName: string): Promise<void> => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
