import { createSpursProxy } from "@spurs-cloud/accounts/next";

export const proxy = createSpursProxy({
  appUrl: process.env.APP_URL,
});

export const config = {
  matcher: [
    "/workspaces/:path*",
    "/w/:path*",
    "/api/workspaces/:path*",
    "/api/invites/:path*",
  ],
};
