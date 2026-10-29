import { createSpursProxy } from "@spurs-cloud/accounts/next";

export const proxy = createSpursProxy({
  appUrl: process.env.APP_URL,
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/workspaces/:path*",
    "/w/:path*",
    "/api/workspaces/:path*",
  ],
};
