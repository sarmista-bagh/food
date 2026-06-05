// export const authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {

//         // 1. must be authenticated
//         if (!req.user) {
//             return res.status(401).json({
//                 message: "Not authenticated"
//             });
//         }

//         const userRole = req.user.role?.toLowerCase();

//         // 2. normalize allowed roles
//         const normalizedRoles = allowedRoles.map(r => r.toLowerCase());

//         // 3. check role
//         if (!normalizedRoles.includes(userRole)) {
//             return res.status(403).json({
//                 message: "Access denied"
//             });
//         }

//         next();
//     };
// };














export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        console.log("=================================");
        console.log("REQ USER:", req.user);
        console.log("USER ROLE:", req.user?.role);
        console.log("ALLOWED ROLES:", allowedRoles);
        console.log("=================================");

        // Must be authenticated
        if (!req.user) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        const userRole = req.user.role?.toLowerCase();

        const normalizedRoles = allowedRoles.map(role =>
            role.toLowerCase()
        );

        // Role check
        if (!normalizedRoles.includes(userRole)) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        next();
    };
};