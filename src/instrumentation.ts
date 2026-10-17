export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { inviteSecret } = await import("./lib/invite");
    inviteSecret();
    const { warnProxyConfiguration } = await import("./lib/client-ip");
    warnProxyConfiguration();
  }
}
