// ---------------------------------------------------------------------
// <copyright file="roleMiddleware.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

export const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Error checking user role'
            });
        }
    };
};
