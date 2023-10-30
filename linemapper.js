const lineMapper = {
    
    init: function (options) {
        this.canvas = document.getElementById(options.canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        let parentElement = this.canvas.parentElement;
        while (parentElement) {
            // Check if the parent element has the desired characteristics, e.g., you can check for a class or a specific attribute
            if (parentElement.classList.contains('linemapper')) {
                // Set the canvas dimensions to match the parent element
                this.canvas.width = parentElement.clientWidth;
                this.canvas.height = parentElement.clientHeight;
                break;
            } else {
                console.warn('[LineMapper] Init called, but no container with "linemapper" class was found, this might result in unexpected behavior.')
            }
            // Continue up the hierarchy to find the desired parent
            parentElement = parentElement.parentElement;
        }
        
        this.isPanning = false;
        this.initialZoom = 1;
        this.initialDistance = 0;
        
        this.virtualWidth = options.canvasWidth || 10000; // X
        this.virtualHeight = options.canvasHeight || 10000; // Y;
        this.touchZoomFactor = options.touchZoomFactor || 0.1;
        this.panSpeed = options.panSpeed || 1;
        this.zoom = options.defaultZoom || 0.5;
        this.panX = options.defaultX || 0;
        this.panY = options.defaultY || 0;
        this.font = options.font || 'sans-serif';
        this.waypointsData = options.waypoints || [{
            name: "Default waypoint",
            description: "Default waypoint, maybe you forgot to initialize your own waypoints?",
            x: 250,
            y: 250,
            type: "square", 
            textposition: "bottom"
        },
        {
            name: "Default waypoint 2",
            description: "Default waypoint, maybe you forgot to initialize your own waypoints?",
            x: -250,
            y: -250,
            type: "hexagon", 
            textposition: "top"
        },
        {
            name: "Default waypoint 3",
            description: "Default waypoint, maybe you forgot to initialize your own waypoints?",
            x: -150,
            y: 150,
            type: "circle", 
            textposition: "bottom"
        }];
        this.shapesData = options.shapes || [{
            name: "square",
            size: 30,
            shape: 'square',
            color: 'cyan',
            fontSize: 24
        },
        {
            name: "hexagon",
            size: 15,
            shape: 'hexagon',
            color: 'cyan',
            fontSize: 24
        },
        {
            name: "circle",
            size: 30,
            shape: 'circle',
            color: 'cyan',
            fontSize: 24
        }];
        
        this.mainLineData = options.mainLine || {
            startPosX: -500,
            startPosY: 0,
            endPosX: 500,
            endPosY: 500,
            color: '#f00',
            orientation: 'horizontal',
            branchSquareColor: 'white',
            width: 20
        }
        
        
        if (this.mainLineData.orientation === 'vertical') {
            this.mainLineData.startPosX = this.mainLineData.endPosX = this.mainLineData.startPosX || 0;
        } else {
            this.mainLineData.startPosY = this.mainLineData.endPosY = this.mainLineData.startPosY || 0;
        }
        
        this.orientation = this.mainLineData.orientation || 'horizontal';
        
        this.handlers = options.handlers || {};
        
        this.cursorChangeTimeout = null;
        this.clickedWaypoint = null;
        this.panningTouchId = null;
        this.panningTouchX = null;
        this.panningTouchY = null;
        this.lastMouseX = null;
        
        this.addEventListeners();
        this.draw(); // Initial drawing
    },
    
    draw: function () {
        
        if (!this.ctx) {
            console.error('[LineMapper] Canvas context is not initialized. Call init() first.');
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2;
        
        const drawWaypoint = (waypoint) => {
            const currentShape = this.shapesData.find(shape => shape.name === waypoint.type);
            const x = waypoint.x;
            const y = waypoint.y;
            
            if (!waypoint.floatingwaypoint) {
                switch(this.orientation) {
                    case 'vertical': 
                    this.drawShape(this.mainLineData.startPosX, y, this.mainLineData.color, 15, 'line', x, y);
                    this.drawShape(this.mainLineData.startPosX, y, this.mainLineData.branchSquareColor, 20, 'square');
                    break;
                    case 'horizontal': 
                    this.drawShape(x, this.mainLineData.startPosY, this.mainLineData.color, 15, 'line', x, y);
                    this.drawShape(x, this.mainLineData.startPosY, this.mainLineData.branchSquareColor, 20, 'square');
                    break;
                    default: 
                    this.drawShape(x, this.mainLineData.startPosY, this.mainLineData.color, 15, 'line', x, y);
                    this.drawShape(x, this.mainLineData.startPosY, this.mainLineData.branchSquareColor, 20, 'square');
                    break;
                }
            }
            
            
            let fontSizeBig = currentShape.fontSize * this.zoom;
            let textOffsetHorizontal = currentShape.fontSize * 1.25 * this.zoom;
            let textOffsetVertical = currentShape.fontSize * 2 * this.zoom;
            this.drawShape(x, y, currentShape.color, currentShape.size, currentShape.shape);
            
            let textX, textY;
            
            switch (waypoint.textposition) {
                default:
                this.ctx.textAlign = "center";
                textX = (x - this.panX) * this.zoom + offsetX;
                textY = (y - this.panY) * this.zoom + offsetY + textOffsetVertical;
                break;
                case 'right':
                this.ctx.textAlign = "left";
                textX = (x - this.panX) * this.zoom + offsetX + textOffsetHorizontal;
                textY = (y - this.panY) * this.zoom + offsetY;
                break;
                case 'top':
                this.ctx.textAlign = "center";
                textX = (x - this.panX) * this.zoom + offsetX;
                textY = (y - this.panY) * this.zoom + offsetY - textOffsetVertical;
                break;
                case 'left':
                this.ctx.textAlign = "right";
                textX = (x - this.panX) * this.zoom + offsetX - textOffsetHorizontal;
                textY = (y - this.panY) * this.zoom + offsetY;
                break;
            }
            
            this.ctx.fillStyle = currentShape.color;
            this.ctx.font = `${fontSizeBig}px ${this.font}`;
            this.ctx.fillText(waypoint.name, textX, textY);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${14 * this.zoom}px ${this.font}`;
            this.ctx.fillText(`X: ${waypoint.x} | Z: ${waypoint.y}`, textX, textY + 14 * this.zoom * 1.25);
        };
        
        // Draw the main line with a consistent width
        this.drawShape(this.mainLineData.startPosX, this.mainLineData.startPosY, this.mainLineData.color, this.mainLineData.width, 'line', this.mainLineData.endPosX, this.mainLineData.endPosY);
        
        // Draw the waypoints
        this.waypointsData.forEach(drawWaypoint);
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    
    
    drawShape: function (x, y, color, size, shapeType, x1, y1) {
        const screenX = (x - this.panX) * this.zoom + this.canvas.width / 2;
        const screenY = (y - this.panY) * this.zoom + this.canvas.height / 2;
        const scaledSize = size * this.zoom;
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size * this.zoom; // Default line thickness
        
        this.ctx.beginPath();
        
        switch (shapeType) {
            case 'circle':
            const radius = scaledSize / 2;
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            break;
            
            case 'line':
            const screenX1 = (x - this.panX) * this.zoom + this.canvas.width / 2;
            const screenY1 = (y - this.panY) * this.zoom + this.canvas.height / 2;
            const screenX2 = (x1 - this.panX) * this.zoom + this.canvas.width / 2;
            const screenY2 = (y1 - this.panY) * this.zoom + this.canvas.height / 2;
            
            this.ctx.moveTo(screenX1, screenY1);
            this.ctx.lineTo(screenX2, screenY2);
            this.ctx.stroke();
            break;
            
            case 'square':
            this.ctx.fillRect(screenX - scaledSize / 2, screenY - scaledSize / 2, scaledSize, scaledSize);
            break;
            
            case 'hexagon':
            this.ctx.moveTo(screenX + scaledSize * Math.cos(0), screenY + scaledSize * Math.sin(0));
            for (let i = 1; i <= 6; i++) {
                const angle = (i * 2 * Math.PI) / 6;
                this.ctx.lineTo(screenX + scaledSize * Math.cos(angle), screenY + scaledSize * Math.sin(angle));
            }
            this.ctx.closePath();
            this.ctx.fill();
            break;
        }
    },
    
    handleCanvasClick: function (event) {
        // Check if a waypoint was clicked
        for (const waypoint of this.waypointsData) {
            const x = waypoint.x;
            const y = waypoint.y;
            
            // Calculate the screen position of the waypoint
            const screenX = (x - this.panX) * this.zoom + this.canvas.width / 2;
            const screenY = (y - this.panY) * this.zoom + this.canvas.height / 2;
            
            // Calculate the distance from the click to the center of the hexagon
            const distance = Math.sqrt((event.clientX - screenX) ** 2 + (event.clientY - screenY) ** 2);
            
            // Check if the click is within a reasonable distance to the hexagon
            if (distance <= 18 * this.zoom && !this.isPanning) {
                // Waypoint (hexagon) clicked; store the clicked waypoint
                this.clickedWaypoint = waypoint;
                
                // Display a popup with waypoint information or another user action
                if ( this.handlers.waypointClick && typeof this.handlers.waypointClick === 'function') {
                    this.handlers.waypointClick(waypoint);
                }
                this.canvas.style.cursor = 'pointer';
                break; // No need to check other waypoints
            } else {
                if ( this.handlers.waypointClickOutside && typeof this.handlers.waypointClickOutside === 'function') {
                    this.handlers.waypointClickOutside(waypoint);
                }
            }
        }
    },
    
    showCoordinates: function (event) {
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2;
        const virtualX = (event.clientX - offsetX) / this.zoom + this.panX;
        const virtualY = (event.clientY - offsetY) / this.zoom + this.panY;
        
        if (this.handlers.showCoordinates && typeof this.handlers.showCoordinates === 'function') {
            this.handlers.showCoordinates(virtualX, virtualY);
        }
    },
    
    handleWheel: function (event) {
        event.preventDefault(); // Prevent the default scrolling behavior
        const zoomFactor = 0.1;
        const zoomDelta = event.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor; // Reverse the zoom direction
        const rect = this.canvas.getBoundingClientRect(); // Get the canvas's position and dimensions
        const mouseX = event.clientX - rect.left; // Calculate mouseX relative to the canvas
        const mouseY = event.clientY - rect.top; // Calculate mouseY relative to the canvas
        const canvasCenterX = rect.width / 2; // Use canvas dimensions from the rect object
        const canvasCenterY = rect.height / 2;
        const oldPanX = this.panX;
        const oldPanY = this.panY;
        const newZoom = this.zoom * zoomDelta;
        
        // Prevent zooming beyond the minimum and maximum zoom levels
        if (newZoom < 0.1 || newZoom > 2) { return; }
        
        this.zoom = newZoom;
        
        // Calculate the shift in the center point caused by the zoom
        const centerShiftX = (canvasCenterX - mouseX) / this.zoom - (canvasCenterX - mouseX) / (this.zoom / zoomDelta);
        const centerShiftY = (canvasCenterY - mouseY) / this.zoom - (canvasCenterY - mouseY) / (this.zoom / zoomDelta);
        
        // Adjust pan values to keep the middle of the screen fixed
        this.panX = oldPanX + centerShiftX;
        this.panY = oldPanY + centerShiftY;
        
        this.draw();
    },
    
    
    handleMouseDown: function (event) {
        if (event.button === 0) {
            this.isPanning = true; // Use this.isPanning to access the object property
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            
            this.cursorChangeTimeout = setTimeout(() => { this.canvas.style.cursor = 'move'; }, 75);
        }
    },
    
    
    handleMouseUp: function (event) {
        if (event.button === 0) {
            this.isPanning = false;
            clearTimeout(this.cursorChangeTimeout);
            this.canvas.style.cursor = 'default';
        }
    },
    
    handleMouseMove: function (event) {
        if (this.isPanning) {
            const deltaX = (this.lastMouseX - event.clientX);
            const deltaY = (this.lastMouseY - event.clientY);
            this.panX += deltaX / this.zoom;
            this.panY += deltaY / this.zoom;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            this.draw();
        } else {
            for (const waypoint of this.waypointsData) {
                const x = waypoint.x;
                const y = waypoint.y;
                const screenX = (x - this.panX) * this.zoom + this.canvas.width / 2;
                const screenY = (y - this.panY) * this.zoom + this.canvas.height / 2;
                const distance = Math.sqrt((event.clientX - screenX) ** 2 + (event.clientY - screenY) ** 2);
                
                if (distance <= 18 * this.zoom) {
                    this.clickedWaypoint = waypoint;
                    this.canvas.style.cursor = 'pointer';
                    break;
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        }
    },
    
    handleTouchStart: function (event) {
        event.preventDefault();
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.initialZoom = this.zoom;
            this.initialDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
                );
            } else if (event.touches.length === 1) {
                const touch = event.touches[0];
                this.panningTouchId = touch.identifier;
                this.panningTouchX = touch.clientX;
                this.panningTouchY = touch.clientY;
            }
        },
        
        handleTouchMove: function (event) {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                    );
                    
                    this.zoom = (currentDistance / this.initialDistance) * this.initialZoom;
                    
                    if (this.zoom < 0.1) this.zoom = 0.1;
                    if (this.zoom > 2) this.zoom = 2;
                    
                    this.draw();
                } else if (event.touches.length === 1) {
                    if (event.touches[0].identifier === this.panningTouchId) {
                        const touch = event.touches[0];
                        const deltaX = (this.panningTouchX - touch.clientX) / this.zoom * this.panSpeed;
                        const deltaY = (this.panningTouchY - touch.clientY) / this.zoom * this.panSpeed;
                        
                        this.panX += deltaX;
                        this.panY += deltaY;
                        
                        this.panningTouchX = touch.clientX;
                        this.panningTouchY = touch.clientY;
                        
                        this.draw();
                    }
                }
            },
            
            handleTouchEnd: function (event) {
                this.isPanning = false;
            },
            
            
            addEventListeners: function () {
                this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
                this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
                this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
                this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
                window.addEventListener('mouseup', this.handleMouseUp.bind(this));
                this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
                this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
                this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
                this.canvas.addEventListener('mousemove', this.showCoordinates.bind(this));
            },
        }