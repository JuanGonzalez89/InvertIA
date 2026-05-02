import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Definimos qué rutas requieren que el usuario esté autenticado
const isProtectedRoute = createRouteMatcher([
  '/cartera(.*)',
  '/mercado(.*)',
  '/movimientos(.*)',
  '/chat(.*)',
  '/perfil(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // Si la ruta está protegida, forzamos el login
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
