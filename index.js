const RESOLUTION = 800;

let canvas;
let ctxt;

let showMaze;

let maze;
let light;

window.onload = () => {
    showMaze = document.getElementById("showMaze");
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctxt = canvas.getContext("2d");

    maze = new Maze(5, 0.25);
    light = new Light(maze);

    canvas.onmousemove = (e) => {
        let size = Math.min(canvas.width, canvas.height);
        let offsetX = (canvas.width - size) / 2;
        let offsetY = (canvas.height - size) / 2;

        light.x = (e.clientX - offsetX) / size;
        light.y = (e.clientY - offsetY) / size;
        light.update(maze);
    }

    canvas.ontouchmove = (e) => {
        let size = Math.min(canvas.width, canvas.height);
        let offsetX = (canvas.width - size) / 2;
        let offsetY = (canvas.height - size) / 2;

        light.x = (e.touches[0].clientX - offsetX) / size;
        light.y = (e.touches[0].clientY - offsetY) / size;
        light.update(maze);
    }

    loop();
}

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function loop() {
    ctxt.clearRect(0, 0, canvas.width, canvas.height);

    ctxt.save();

    let size = Math.min(canvas.width, canvas.height);

    ctxt.setTransform(size, 0, 0, size, (canvas.width - size) / 2, (canvas.height - size) / 2);

    if(showMaze.checked) {
        maze.render(ctxt);
    }

    light.render(ctxt);

    ctxt.restore();

    requestAnimationFrame(loop);
}

class Maze {
    constructor(size, margin) {
        let grid = [];
        for(let y=0;y<size;y++) {
            let row = [];
            for(let x=0;x<size;x++) {
                // bits:
                // can be visited
                // has wall top
                // has wall right
                // has wall bottom
                // has wall left
                row.push(0b11111);
            }
            grid.push(row);
        }

        // recursive backtracking maze generation
        let stack = [[0, 0]];
        while(stack.length > 0) {
            let [y, x] = stack[stack.length - 1];

            let options = [];
            if(y !== 0 && (grid[y-1][x] & 0b10000) !== 0) { options.push(0) }
            if(x !== size-1 && (grid[y][x+1] & 0b10000) !== 0) { options.push(1) }
            if(y !== size-1 && (grid[y+1][x] & 0b10000) !== 0) { options.push(2) }
            if(x !== 0 && (grid[y][x-1] & 0b10000) !== 0) { options.push(3) }

            if(options.length === 0) {
                stack.pop();
                continue;
            }

            let option = options[Math.floor(Math.random() * options.length)];
            switch (option) {
                case 0:
                    grid[y][x] &= 0b0111;
                    grid[y-1][x] &= 0b1101;
                    stack.push([y-1, x]);
                    break;
                case 1:
                    grid[y][x] &= 0b1011;
                    grid[y][x+1] &= 0b1110;
                    stack.push([y, x+1]);
                    break;
                case 2:
                    grid[y][x] &= 0b1101;
                    grid[y+1][x] &= 0b0111;
                    stack.push([y+1, x]);
                    break;
                case 3:
                    grid[y][x] &= 0b1110;
                    grid[y][x-1] &= 0b1011;
                    stack.push([y, x-1]);
                    break;
            }
        }

        // convert to polygon by following/creating edges in counter-clockwise order
        this.polygon = [];
        let corner = 0;
        let y = 0;
        let x = 0;

        do {
            // edge points of a cell
            let a = [(y + margin) / size, (x + margin) / size];
            let b = [(y + margin) / size, (x + 1 - margin) / size];
            let c = [(y + 1 - margin) / size, (x + 1 - margin) / size];
            let d = [(y + 1 - margin) / size, (x + margin) / size];

            // every possible configuration (yes that took a while..)
            switch (grid[y][x]) {
                case 0b0000:
                    switch (corner) {
                        case 0: this.polygon.push(a);
                            corner = 1;
                            x--;
                            break;
                        case 1: this.polygon.push(b);
                            corner = 2;
                            y--;
                            break;
                        case 2: this.polygon.push(c);
                            corner = 3;
                            x++;
                            break;
                        case 3: this.polygon.push(d);
                            corner = 0;
                            y++;
                    }
                    break;
                case 0b0001:
                    switch (corner) {
                        case 0:
                            y++;
                            break;
                        case 1: this.polygon.push(b);
                            corner = 2;
                            y--;
                            break;
                        case 2: this.polygon.push(c);
                            corner = 3;
                            x++;
                    }
                    break;
                case 0b0010:
                    switch (corner) {
                        case 0: this.polygon.push(a);
                            corner = 1;
                            x--;
                            break;
                        case 1: this.polygon.push(b);
                            corner = 2;
                            y--;
                            break;
                        case 3:
                            x++;
                    }
                    break;
                case 0b0011:
                    switch (corner) {
                        case 0: this.polygon.push(d);
                            corner = 3;
                            x++;
                            break;
                        case 1: this.polygon.push(b);
                            corner = 2;
                            y--;
                    }
                    break;
                case 0b0100:
                    switch (corner) {
                        case 0: this.polygon.push(a);
                            corner = 1;
                            x--;
                            break;
                        case 2:
                            y--;
                            break;
                        case 3: this.polygon.push(d);
                            corner = 0;
                            y++;

                    }
                    break;
                case 0b0101:
                    switch (corner) {
                        case 0:
                            y++;
                            break;
                        case 2:
                            y--;
                    }
                    break;
                case 0b0110:
                    switch (corner) {
                        case 0: this.polygon.push(a);
                            corner = 1;
                            x--;
                            break;
                        case 3: this.polygon.push(c);
                            corner = 2;
                            y--;
                    }
                    break;
                case 0b0111:
                    this.polygon.push(d);
                    this.polygon.push(c);
                    corner = 2;
                    y--;
                    break;
                case 0b1000:
                    switch (corner) {
                        case 1:
                            x--;
                            break;
                        case 2: this.polygon.push(c);
                            corner = 3;
                            x++;
                            break;
                        case 3: this.polygon.push(d);
                            corner = 0;
                            y++;
                    }
                    break;
                case 0b1001:
                    switch (corner) {
                        case 1: this.polygon.push(a);
                            corner = 0;
                            y++;
                            break;
                        case 2: this.polygon.push(c);
                            corner = 3;
                            x++;
                    }
                    break;
                case 0b1010:
                    switch (corner) {
                        case 1:
                            x--;
                            break;
                        case 3:
                            x++;
                    }
                    break;
                case 0b1011:
                    this.polygon.push(a);
                    this.polygon.push(d);
                    x++;
                    corner = 3;
                    break;
                case 0b1100:
                    switch (corner) {
                        case 2: this.polygon.push(b);
                            corner = 1;
                            x--;
                            break;
                        case 3: this.polygon.push(d);
                            corner = 0;
                            y++;
                    }
                    break;
                case 0b1101:
                    this.polygon.push(b);
                    this.polygon.push(a);
                    y++;
                    corner = 0;
                    break;
                case 0b1110:
                    this.polygon.push(c);
                    this.polygon.push(b);
                    corner = 1;
                    x--;
            }
        } while(y !== 0 || x !== 0);

        this.start = [0.5 / size, 0.5 / size];
    }

    render(ctxt) {
        ctxt.lineWidth = 0.005;

        ctxt.beginPath();
        ctxt.moveTo(this.polygon[0][1], this.polygon[0][0]);
        for(let i=1;i<this.polygon.length;i++) {
            ctxt.lineTo(this.polygon[i][1], this.polygon[i][0]);
        }
        ctxt.closePath();

        ctxt.fillStyle = "#AAA";
        ctxt.fill();
        ctxt.stroke();

        ctxt.fillStyle = "#333";
        for(let [y, x] of this.polygon) {
            ctxt.beginPath();
            ctxt.arc(x, y, 0.01, 0, 2 * Math.PI);
            ctxt.fill();
        }
    }
}

class Light {
    constructor(maze) {
        this.y = maze.start[0];
        this.x = maze.start[1];

        this.visible = [];

        this.update(maze);
    }

    update(maze) {
        let visibleIndices = [];
        this.visible = [];

        if(!this.isInside(maze)) {
            return;
        }

        // compute all visible vertices
        for(let i=0;i<maze.polygon.length;i++) {
            let [y, x] = maze.polygon[i];

            let visible = true;
            for(let j=0;j<maze.polygon.length+1;j++) {
                let index1 = (j) % maze.polygon.length;
                let index2 = (j+1) % maze.polygon.length;
                let [y1, x1] = maze.polygon[index1];
                let [y2, x2] = maze.polygon[index2];

                if(index1 === i || index2 === i) {
                    continue;
                }

                if(linesIntersect(this.x, this.y, x, y, x1, y1, x2, y2)) {
                    // intersection in line of sight -> not visible
                    visible = false;
                    break;
                }
            }

            if(!visible) {
                continue;
            }

            visibleIndices.push(i);
        }

        for(let i=0;i<visibleIndices.length;i++) {
            let visible1 = visibleIndices[(i) % visibleIndices.length];
            let visible2 = visibleIndices[(i+1) % visibleIndices.length];

            let next = (visible1 + 1) % maze.polygon.length;

            this.visible.push(maze.polygon[visible1]);

            if(next === visible2) {
                continue
            }

            // there was a jump in the indices, so there could/should be partially visible edges

            let closestPointA = null;
            let closestDistancePointA = Infinity;
            let closestPointB = null;
            let closestDistancePointB = Infinity;

            let vertex1 = maze.polygon[visible1]
            let vertex2 = maze.polygon[visible2]

            // two rays for each of the vertices
            let mA = (vertex1[0] - this.y) / (vertex1[1] - this.x);
            let mB = (vertex2[0] - this.y) / (vertex2[1] - this.x);
            let cA = this.y - mA * this.x;
            let cB = this.y - mB * this.x;

            // compute ray directions
            let directionA;
            if(this.y > vertex1[0]) {
                if(this.x > vertex1[1]) {
                    directionA = 0;
                }else {
                    directionA = 1;
                }
            }else {
                if(this.x > vertex1[1]) {
                    directionA = 3;
                }else {
                    directionA = 2;
                }
            }
            let directionB;
            if(this.y > vertex2[0]) {
                if(this.x > vertex2[1]) {
                    directionB = 0;
                }else {
                    directionB = 1;
                }
            }else {
                if(this.x > vertex2[1]) {
                    directionB = 3;
                }else {
                    directionB = 2;
                }
            }

            // iterate through edges in-between
            let index1 = visible1;
            let index2 = (index1 + 1) % maze.polygon.length;

            while(index1 !== visible2) {
                let point1 = maze.polygon[index1];
                let point2 = maze.polygon[index2];

                let pointA = null;
                let pointB = null;

                // compute intersection
                if(Math.abs(point1[0] - point2[0]) < 10e-3) {
                    // horizontal (same y)
                    let y = point1[0];
                    let xA = (y - cA) / mA;
                    let xB = (y - cB) / mB;

                    let minX;
                    let maxX;
                    if(point1[1] < point2[1]) {
                        minX = point1[1];
                        maxX = point2[1];
                    }else {
                        minX = point2[1];
                        maxX = point1[1];
                    }

                    if(minX < xA && maxX > xA) {
                        pointA = [y, xA];
                    }
                    if(minX < xB && maxX > xB) {
                        pointB = [y, xB];
                    }
                } else {
                    // vertical (same x)
                    let x = point1[1];
                    let yA = mA * x + cA;
                    let yB = mB * x + cB;

                    let minY;
                    let maxY;
                    if(point1[0] < point2[0]) {
                        minY = point1[0];
                        maxY = point2[0];
                    }else {
                        minY = point2[0];
                        maxY = point1[0];
                    }

                    if(minY < yA && maxY > yA) {
                        pointA = [yA, x];
                    }
                    if(minY < yB && maxY > yB) {
                        pointB = [yB, x];
                    }
                }

                // ignore points the ray is originating from
                if(index1 === visible1) {
                    pointA = null;
                }
                if(index2 === visible2) {
                    pointB = null;
                }

                if(pointA !== null) {
                    let directionPointA;
                    if(this.y > pointA[0]) {
                        if(this.x > pointA[1]) {
                            directionPointA = 0;
                        }else {
                            directionPointA = 1;
                        }
                    }else {
                        if(this.x > pointA[1]) {
                            directionPointA = 3;
                        }else {
                            directionPointA = 2;
                        }
                    }

                    // computed point has to be the closest but also in the correct direction (point behind could potentially be closer)
                    let distancePointA = Math.hypot(pointA[0] - this.y, pointA[1] - this.x);
                    if(directionA == directionPointA && distancePointA < closestDistancePointA) {
                        closestPointA = pointA;
                        closestDistancePointA = distancePointA;
                    }
                }
                if(pointB !== null) {
                    let directionPointB;
                    if(this.y > pointB[0]) {
                        if(this.x > pointB[1]) {
                            directionPointB = 0;
                        }else {
                            directionPointB = 1;
                        }
                    }else {
                        if(this.x > pointB[1]) {
                            directionPointB = 3;
                        }else {
                            directionPointB = 2;
                        }
                    }

                    // computed point has to be the closest but also in the correct direction (point behind could potentially be closer)
                    let distancePointB = Math.hypot(pointB[0] - this.y, pointB[1] - this.x);
                    if(directionB == directionPointB && distancePointB < closestDistancePointB) {
                        closestPointB = pointB;
                        closestDistancePointB = distancePointB;
                    }
                }

                index1 = index2;
                index2 = (index2 + 1) % maze.polygon.length;
            }

            if(closestPointA !== null && closestPointB !== null) {
                // Edge-case: one point might not be necessary and is therefore computed as a point through the wall
                // If the other point is aligned with the vertex of the other ray, the other point is not necessary / wrong
                if(closestPointA[1] === vertex2[1] || closestPointA[0] === vertex2[0]) {
                    this.visible.push(closestPointA);
                } else if(closestPointB[1] === vertex1[1] || closestPointB[0] === vertex1[0]) {
                    this.visible.push(closestPointB);
                } else {
                    this.visible.push(closestPointA);
                    this.visible.push(closestPointB);
                }
            } else {
                if(closestPointA !== null) {
                    this.visible.push(closestPointA);
                }
                if(closestPointB !== null) {
                    this.visible.push(closestPointB);
                }
            }
        }
    }

    isInside(maze) {
        let intersections = 0;
        for(let i=0;i<maze.polygon.length;i++) {
            let j = (i+1) % maze.polygon.length;

            let vertex1 = maze.polygon[i];
            let vertex2 = maze.polygon[j];

            // only vertical lines (same x)
            if(Math.abs(vertex1[0] - vertex2[0]) < 10e-3) {
                continue;
            }

            // to the right
            if(vertex1[1] < this.x) {
                continue;
            }

            let minY;
            let maxY;

            if(vertex1[0] < vertex2[0]) {
                minY = vertex1[0];
                maxY = vertex2[0];
            }else {
                minY = vertex2[0];
                maxY = vertex1[0];
            }

            // inside bounds
            if(this.y < minY || this.y > maxY) {
                continue;
            }

            intersections++;
        }

        return intersections % 2 === 1;
    }

    render(ctxt) {
        ctxt.lineWidth = 0.005;
        ctxt.fillStyle = "#FD03";
        ctxt.strokeStyle = "#FD0";
        ctxt.beginPath();
        ctxt.arc(this.x, this.y, 0.01, 0, 2 * Math.PI);
        ctxt.fill();

        if(this.visible.length === 0) {
            return;
        }

        ctxt.moveTo(this.visible[0][1], this.visible[0][0]);
        for(let i=1;i<this.visible.length;i++) {
            ctxt.lineTo(this.visible[i][1], this.visible[i][0]);
        }
        ctxt.closePath();
        ctxt.stroke();
        ctxt.fill();

        for(let [y, x] of this.visible) {
            ctxt.beginPath();
            ctxt.arc(x, y, 0.01, 0, 2 * Math.PI);
            ctxt.fill();
        }
    }
}

function ccw(ax, ay, bx, by, cx, cy) {
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}

function linesIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    return (
        ccw(ax, ay, cx, cy, dx, dy) != ccw(bx, by, cx, cy, dx, dy) &&
        ccw(ax, ay, bx, by, cx, cy) != ccw(ax, ay, bx, by, dx, dy)
    );
}
