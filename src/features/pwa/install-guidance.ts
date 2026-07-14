export type InstallPlatform = "ios" | "android" | "desktop";

export function getInstallGuidance(platform: InstallPlatform) {
  if (platform === "ios") return "Tekan butang Kongsi, kemudian pilih Tambah ke Skrin Utama.";
  if (platform === "android") return "Buka menu pelayar dan pilih Pasang aplikasi atau Tambah ke skrin utama.";
  return "Klik ikon pemasangan pada bar alamat pelayar, kemudian sahkan pemasangan.";
}
