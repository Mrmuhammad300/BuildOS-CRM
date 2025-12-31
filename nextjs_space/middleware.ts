export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/rfis/:path*', '/submittals/:path*', '/daily-reports/:path*', '/documents/:path*', '/change-orders/:path*', '/punch-items/:path*', '/profile/:path*'],
};
