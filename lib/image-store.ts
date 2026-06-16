import { get, set, del } from "idb-keyval"

export async function saveImage(key: string, dataUrl: string): Promise<void> {
    await set(key, dataUrl)
}

export async function loadImage(key: string): Promise<string> {
    return (await get<string>(key)) ?? ""
}

export async function deleteImage(key: string): Promise<void> {
    await del(key)
}