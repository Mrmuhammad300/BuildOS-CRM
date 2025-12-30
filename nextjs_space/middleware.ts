export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/rfis/:path*', '/daily-reports/:path*', '/documents/:path*', '/profile/:path*'],
};
