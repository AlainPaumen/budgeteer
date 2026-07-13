import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: () => (
		<html lang="en">
			<body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
				<Outlet />
			</body>
		</html>
	),
});
