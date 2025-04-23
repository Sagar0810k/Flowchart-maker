const NodeTypes = {
    start: {
        color: '#2ecc71',
        defaultWidth: 100,
        defaultHeight: 50,
        
        draw(ctx, x, y, width, height) {
            ctx.beginPath();
            ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        },
        
        // Checks if a point is inside the shape
        containsPoint(node, x, y) {
            const dx = (x - node.x) / (node.width / 2);
            const dy = (y - node.y) / (node.height / 2);
            return (dx * dx + dy * dy) <= 1;
        },
        
        // Gets the point where a connection should attach to this node
        getConnectionPoint(node, targetNode) {
            const angle = Math.atan2(targetNode.y - node.y, targetNode.x - node.x);
            return {
                x: node.x + (node.width / 2) * Math.cos(angle),
                y: node.y + (node.height / 2) * Math.sin(angle)
            };
        }
    },
    
    // Process node (rectangle shape)
    process: {
        color: '#3498db',
        defaultWidth: 120,
        defaultHeight: 60,
        
        // Draws the process node shape
        draw(ctx, x, y, width, height) {
            ctx.beginPath();
            ctx.rect(x - width / 2, y - height / 2, width, height);
            ctx.fill();
            ctx.stroke();
        },
        
        // Checks if a point is inside the shape
        containsPoint(node, x, y) {
            return Math.abs(x - node.x) <= node.width / 2 && 
                   Math.abs(y - node.y) <= node.height / 2;
        },
        
        // Gets the point where a connection should attach to this node
        getConnectionPoint(node, targetNode) {
            const halfWidth = node.width / 2;
            const halfHeight = node.height / 2;
            
            // Calculate the angle between centers
            const dx = targetNode.x - node.x;
            const dy = targetNode.y - node.y;
            const angle = Math.atan2(dy, dx);
            
            // Determine which edge to connect to based on angle
            if (Math.abs(Math.tan(angle)) > node.height / node.width) {
                // Connect to top or bottom
                const y = dy > 0 ? node.y + halfHeight : node.y - halfHeight;
                const x = node.x + halfHeight * Math.tan(Math.PI / 2 - angle) * (dy > 0 ? 1 : -1);
                return { x, y };
            } else {
                // Connect to left or right
                const x = dx > 0 ? node.x + halfWidth : node.x - halfWidth;
                const y = node.y + halfWidth * Math.tan(angle) * (dx > 0 ? 1 : -1);
                return { x, y };
            }
        }
    },
    
    // Decision node (diamond shape)
    decision: {
        color: '#f39c12',
        defaultWidth: 120,
        defaultHeight: 80,
        
        // Draws the decision node shape
        draw(ctx, x, y, width, height) {
            ctx.beginPath();
            ctx.moveTo(x, y - height / 2);
            ctx.lineTo(x + width / 2, y);
            ctx.lineTo(x, y + height / 2);
            ctx.lineTo(x - width / 2, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        },
        
        // Checks if a point is inside the shape
        containsPoint(node, x, y) {
            const dx = Math.abs(x - node.x) / (node.width / 2);
            const dy = Math.abs(y - node.y) / (node.height / 2);
            return dx + dy <= 1;
        },
        
        // Gets the point where a connection should attach to this node
        getConnectionPoint(node, targetNode) {
            const cx = node.x;
            const cy = node.y;
            const hw = node.width / 2;
            const hh = node.height / 2;
        
            const corners = [
                { x: cx, y: cy - hh },           // Top
                { x: cx + hw, y: cy },           // Right
                { x: cx, y: cy + hh },           // Bottom
                { x: cx - hw, y: cy },           // Left
            ];
        
            const sides = [
                [corners[0], corners[1]], // Top → Right
                [corners[1], corners[2]], // Right → Bottom
                [corners[2], corners[3]], // Bottom → Left
                [corners[3], corners[0]], // Left → Top
            ];
        
            // Line from center to target
            const x1 = cx;
            const y1 = cy;
            const x2 = targetNode.x;
            const y2 = targetNode.y;
        
            // Find intersection with one of the diamond's edges
            for (let [p1, p2] of sides) {
                const denom = (p1.x - p2.x) * (y1 - y2) - (p1.y - p2.y) * (x1 - x2);
                if (denom === 0) continue; // Parallel lines
        
                const t = ((p1.x - x1) * (y1 - y2) - (p1.y - y1) * (x1 - x2)) / denom;
                const u = -((p1.x - p2.x) * (p1.y - y1) - (p1.y - p2.y) * (p1.x - x1)) / denom;
        
                if (t >= 0 && t <= 1 && u >= 0) {
                    // Valid intersection
                    return {
                        x: p1.x + t * (p2.x - p1.x),
                        y: p1.y + t * (p2.y - p1.y),
                    };
                }
            }
        
            // Fallback to center if no intersection found
            return { x: cx, y: cy };
        }        
        
    },
    
    // Input/Output node (parallelogram)
    input: {
        color: '#9b59b6',
        defaultWidth: 120,
        defaultHeight: 60,
        
        // Draws the input/output node shape
        draw(ctx, x, y, width, height) {
            const offset = width / 4;
            
            ctx.beginPath();
            ctx.moveTo(x - width / 2 + offset, y - height / 2);
            ctx.lineTo(x + width / 2 + offset, y - height / 2);
            ctx.lineTo(x + width / 2 - offset, y + height / 2);
            ctx.lineTo(x - width / 2 - offset, y + height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        },
        
        // Checks if a point is inside the shape
        containsPoint(node, x, y) {
            const halfWidth = node.width / 2;
            const halfHeight = node.height / 2;
            const offset = node.width / 4;
            
            // Check if the point is within the bounding rectangle first
            if (Math.abs(y - node.y) > halfHeight) return false;
            
            // Calculate the x-coordinate of the parallelogram at the given y
            const relY = (y - node.y) / halfHeight;
            const leftX = node.x - halfWidth - offset * relY;
            const rightX = node.x + halfWidth - offset * relY;
            
            return x >= leftX && x <= rightX;
        },
        
        // Gets the point where a connection should attach to this node
        getConnectionPoint(node, targetNode) {
            const halfWidth = node.width / 2;
            const halfHeight = node.height / 2;
            const offset = node.width / 4;
            
            // Calculate the angle between centers
            const dx = targetNode.x - node.x;
            const dy = targetNode.y - node.y;
            const angle = Math.atan2(dy, dx);
            
            // Determine which edge to connect to based on angle
            if (Math.abs(angle) > Math.PI * 3/4 || Math.abs(angle) < Math.PI / 4) {
                // Connect to left or right (with offset)
                const isRight = Math.abs(angle) < Math.PI / 4;
                const x = isRight ? node.x + halfWidth - offset : node.x - halfWidth - offset;
                const relY = Math.tan(angle) * halfWidth;
                const y = node.y + (isRight ? relY : -relY);
                return { x, y };
            } else {
                // Connect to top or bottom
                const isBottom = angle > 0;
                const y = isBottom ? node.y + halfHeight : node.y - halfHeight;
                const relX = halfHeight / Math.tan(isBottom ? angle : angle + Math.PI);
                const x = node.x + relX;
                return { x, y };
            }
        }
    },
    
    // End node (oval shape with different color)
    end: {
        color: '#e74c3c',
        defaultWidth: 100,
        defaultHeight: 50,
        
        // Draws the end node shape (same as start)
        draw(ctx, x, y, width, height) {
            ctx.beginPath();
            ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        },
        
        // Checks if a point is inside the shape (same as start)
        containsPoint(node, x, y) {
            const dx = (x - node.x) / (node.width / 2);
            const dy = (y - node.y) / (node.height / 2);
            return (dx * dx + dy * dy) <= 1;
        },
        
        // Gets the point where a connection should attach to this node (same as start)
        getConnectionPoint(node, targetNode) {
            const angle = Math.atan2(targetNode.y - node.y, targetNode.x - node.x);
            return {
                x: node.x + (node.width / 2) * Math.cos(angle),
                y: node.y + (node.height / 2) * Math.sin(angle)
            };
        }
    }
};
