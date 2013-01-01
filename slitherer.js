var slitherer = window.slitherer = function() {
    //TODO Make field into a closure with multiple layers of canvases
    var mode = 'roads';
    var tool = 'add';
    var contexts = {};
    var cursors = {};
    var width, height, board, coven;
    var selectedSnake;

    var field = {};
    
    // initialize field with canvas elements for different layers
    field.init = function(roadsCanvas, snakesCanvas, laddersCanvas, cursorCanvas) {
        width = roadsCanvas.width;
        height = roadsCanvas.height; 
        contexts['roads'] = roadsCanvas.getContext('2d');
        contexts['snakes'] = snakesCanvas.getContext('2d');
        contexts['ladders'] = laddersCanvas.getContext('2d');
        contexts['cursor'] = cursorCanvas.getContext('2d');

        // init cursors
        ['roads', 'snakes', 'ladders'].forEach(function(mode) {
            cursors[mode] = new Image();
            cursors[mode].src = 'images/'+mode+'cursor.png';
            cursors[mode].loaded = false;
            cursors[mode].onLoad = function() {
                cursors[mode].loaded = true; 
            }
        });

        board = slitherer.board()
            .width(width)
            .height(height)
            .gap(1)
            .numRows(10)
            .numCols(15)
            .create()
            .update(contexts['roads']);

        // init board
        board();

        coven = slitherer.coven()
            .context(contexts['snakes'])
            .width(width).height(height)
            .tilewidth(Math.floor(board.tilewidth()+1)) // add gap
            .tileheight(Math.floor(board.tileheight()+1));

        return field;
    }

    field.mode = function(val) {
        if(val==undefined) return mode;
        mode = val;
        return field;
    }
    
    field.tool = function(val) {
        if(val==undefined) return tool;
        tool = val;
        return field;
    }


    field.clearLayer = function(layer) {
        if(layer=='roads') board.clear(contexts[layer]);
        if(layer=='snakes') coven.clear();
        else contexts[layer].clearRect(0, 0, width, height);
    }
    
    field.displayCursor = function(x, y) {
        field.clearLayer('cursor');
        contexts['cursor'].drawImage(cursors[mode], x, y);
    }

    field.addRoadAt = function(x, y) {
        var tile = board.tileAt(x, y); 
        if(!tile) return;
        if(!tile.isRoad()) {
            try {
                board.addRoad(tile, contexts['roads']);
            } catch (err) {
                throw err;
                return;
            }
            tile.isRoad(true);
        }
    }

    field.selectSnake = function(val) {
        // TODO: select snake using coordinates
    }

    field.addSnake = function(x, y) {
        coven.addSnake(x, y);
    }

    field.updateSnake = function(x, y) {
        if(!selectedSnake) {
            selectedSnake = coven.getLastSnake();
        }
        coven.updateSnake(selectedSnake, x, y);
    }
    
    field.endSnake = function(x, y) {
        field.updateSnake(x, y);
        selectedSnake = null;
    }
     
    return field;
}

slitherer.coven = function() {
    var context, width, height, tilewidth, tileheight;
    var head = new Image();
    head.src = 'images/snakehead.png';
    head.loaded = false;
    head.onLoad = function() { head.loaded = true; };

    var body = new Image();
    body.src = 'images/snakebody.png';
    body.loaded = false;
    body.onLoad = function() { body.loaded = true; };

    var tail = new Image();
    tail.src = 'images/snaketail.png';
    tail.loaded = false;
    tail.onLoad = function() { tail.loaded = true; };

    var snakes = [];
    var coven = {};
    coven.context = function(val) {
        if(val==undefined) return context;
        context = val;
        return coven;
    }
    coven.clear = function() {
        snakes = [];
        context.clearRect(0, 0, width, height);
    } 
    coven.width = function(val) {
        if(val==undefined) return val;
        width = val;
        return coven;
    }
    coven.height = function(val) {
        if(val==undefined) return val;
        height = val;
        return coven;
    }
    coven.tilewidth = function(val) {
        tilewidth = val;
        return coven;
    }
    coven.tileheight = function(val) {
        tileheight = val;
        return coven;
    }
    coven.getLastSnake = function() {
        return snakes[snakes.length-1];
    }
    coven.addSnake = function(x,y) {
        snakes.push(slitherer.snake()
            .tilewidth(tilewidth).tileheight(tileheight)
            .start(Math.floor(y/tileheight), Math.floor(x/tilewidth))
            .background(head, body, tail));

        var snake = snakes[snakes.length-1];
        return coven;
    }
    coven.updateSnake = function(snake, x, y) {
        snake.end(Math.floor(y/tileheight), Math.floor(x/tilewidth));
        coven.update();
        return coven;
    }
    coven.update = function() {
        context.clearRect(0, 0, width, height);

        snakes.forEach(function(snake){
            snake.draw(context); 
        });
    }
    return coven;
}

slitherer.snake = function() {
    var tilewidth, tileheight;

    var start = {}
    start.row = start.col = 0;

    var end = {}
    end.row = end.col = 0;

    var head, body, tail;
    var snake = {};
    snake.background = function(h, b, t) {
        head = h;
        body = b;
        tail = t;
        return snake; 
    }
    snake.tilewidth = function(val) {
        if(val==undefined) return tilewidth;
        tilewidth = val; 
        return snake;
    }
    snake.tileheight = function(val) {
        if(val==undefined) return tileheight;
        tileheight = val; 
        return snake;
    }
    snake.start = function(row, col) {
        if(row==undefined) return start;
        start.row = row;
        start.col = col;
        return snake;
    }
    snake.end = function(row, col) {
        if(row==undefined) return end;
        end.row = row;
        end.col = col;
        return snake;
    }
    snake.draw = function(context) {
        var startx = tilewidth*start.col + tilewidth/2;
        var starty = tileheight*start.row + tileheight/2;

        var endx = tilewidth*end.col + tilewidth/2;
        var endy = tileheight*end.row + tileheight/2;

        context.lineWidth = 2;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(startx, starty); 
        context.lineTo(endx, endy);
        context.closePath();
        context.strokeStyle = '#000';
        context.stroke();

        var radius = 5;
        context.beginPath();
        context.arc(startx, starty, 5, 0, 2*Math.PI);
        context.arc(endx, endy, 5, 0, 2*Math.PI);
        context.fillStyle = '#000';
        context.fill();
        context.closePath();

        context.save();
        var offset = 10;

        // get rotation of line
        var dx = end.x - start.x;
        var dy = start.y - end.y; // in canvas, y grows down
        var theta = Math.atan(dy/dx);

        context.rotate(theta);
        context.drawImage(head, startx-tilewidth/2, starty-tileheight/2, tilewidth, tileheight);
        context.restore();

        /*
        var offset = 10;

        // get rotation of line
        var dx = end.x - start.x;
        var dy = start.y - end.y; // in canvas, y grows down
        var theta = Math.atan(dy/dx);


        // get x, y offsets for endpoints
        var ox = Math.cos(Math.PI/2 - theta)*offset;
        var oy = Math.sin(Math.PI/2 - theta)*offset;

        context.lineWidth = 2;
        context.lineCap = 'round';

        context.beginPath();
        // draw arc for snake's head
       context.arc(start.x, start.y, offset, Math.PI*0.5-theta, Math.PI*1.5-theta, (dx<0));
        context.moveTo(start.x + ox, start.y + oy);
        context.lineTo(end.x + ox, end.y + oy);
        context.lineTo(end.x - ox, end.y - oy);
        context.lineTo(start.x - ox, start.y - oy);
        context.closePath();

        context.save(); // Save the context before clipping
        context.clip(); // Clip to whatever path is on the context
        context.drawImage(background, 0, 0, 900, 540);
        context.restore(); // Get rid of the clipping region

        context.strokeStyle = '#000';
        context.stroke();
        */
    }
    return snake;
}

slitherer.tile = function() {
    var row, col, width, height, gap, image;
    var isRoad = false;
    var roadNumber = 0;
    
    function tile(context) {
        var x = col*(width+gap);
        var y = row*(height+gap);
        if(image) context.drawImage(image, x, y, width, height);

        if(isRoad) {
            // draw road number
            context.font = "16px Helvetica Neue"; 
            context.fillStyle = "rgba(0, 0, 0, 0.3)";
            context.fillText(roadNumber, x + gap, y + height - gap*5);
        }
    }

    tile.row = function(val) {
        if(val==undefined) return row;
        row = val;
        return tile;
    }

    tile.col = function(val) {
        if(val==undefined) return col;
        col = val; 
        return tile;
    }

    tile.width = function(val) {
        width = Math.floor(val);
        return tile;
    }

    tile.height = function(val) {
        height = Math.floor(val);
        return tile;
    }

    tile.gap = function(val) {
        gap = val;
        return tile;
    }

    tile.image = function(val) {
        if(val==undefined) return image;
        image = val;
        return tile;
    }
    
    tile.update = function(context) {
        context.clearRect(
            col*(width + gap) - gap,
            row*(height + gap) - gap,
            width + gap,
            height + gap
        );
        tile(context);
        return tile;
    }

    tile.isRoad = function(val) {
        if(val==undefined) return isRoad; 
        isRoad = val;
        return tile;
    }

    tile.roadNumber = function(val) {
        if(val==undefined) return roadNumber;
        roadNumber = val;
        return tile;
    }

    return tile;
}

slitherer.board = function() {
    var width, height, numRows, numCols, gap;
    var tilew, tileh;
    var tiles = [];
    var path = [];
    var roadPieces = [];
    var roadTextures = {};
    
    var background = new Image();
    background.src = 'images/grass.jpg';
    background.loaded = false;
    background.onLoad = function() { background.loaded = true; };

    function board(context) {
        // load default textures
        var orientations = ['ns', 'ew', 'se', 'sw', 'ne', 'nw'];        
        orientations.forEach(function(orientation) {
            var tex = new Image();
            tex.src = 'images/' + orientation + '.jpg';
            tex.loaded = false;
            tex.onLoad = function() { tex.loaded = true; };
            tex.orientation = orientation;
            roadTextures[orientation] = tex;

            var reverse = orientation.split("").reverse().join("");
            roadTextures[reverse] = tex;
        });
    }

    board.width = function(val) {
        width = val;
        return board;
    }
    
    board.height = function(val) {
        height = val;
        return board;
    }
    
    board.numRows = function(val) {
        numRows = val;
        return board;
    }
    
    board.numCols = function(val) {
        numCols = val;
        return board;
    }

    board.gap = function(val) {
        gap = val;
        return board;
    }

    board.tilewidth = function() {
        return tilew;
    }

    board.tileheight = function() {
        return tileh;
    }

    board.create = function() {
        // create board
        tilew = (width - gap*(numCols-1)) / numCols;
        tileh = (height - gap*(numRows-1)) / numRows;

        for(var r=0; r<numRows; r++) {
            tiles[r] = [];
            for(var c=0; c<numCols; c++) { 
                tiles[r][c] = slitherer.tile()
                    .row(r).col(c)
                    .width(tilew).height(tileh)
                    .gap(gap)
                    .image(background);
            }
        }  
        return board;
    }

    board.clear = function(context) {
        context.clearRect(0, 0, width, height);
        for(var r=0; r<numRows; r++) {
            for(var c=0; c<numCols; c++) { 
                tiles[r][c].image(background)
                    .isRoad(false);
            }
        }
        roadPieces = [];
        board.update(context);
        
        return board;
    }

    board.update = function(context) {
        if(!background.loaded) setTimeout(function() {
            board.update(context);
        }, 10);

        // render board
        for(var r=0; r<numRows; r++) {
            for(var c=0; c<numCols; c++) { 
                tiles[r][c](context);
            }
        }
        return board;
    }

    board.addRoad = function(tile, context) {
        if(positionNotConnected(tile)) {
            throw "Illegal";
        }

        try {
            updateRoad(tile, context);
        } catch(err) {
            throw err;
        }

        // add tile to continuing road
        roadPieces.push(tile);
        tile.roadNumber(roadPieces.length);
    }

    // returns 'n', 's', 'e', 'w' that describes tile's location
    // relative to adjacent
    function findRelativeLocation(tile, adjacent) {
        var tr = tile.row(); 
        var tc = tile.col();
        var ar = adjacent.row();
        var ac = adjacent.col();

        var dr = ar-tr;
        var dc = ac-tc;
        
        // not adjacent
        if(Math.abs(dr) + Math.abs(dc) > 1) {
            return false;
        }

        if(dr==1) return 'n';
        else if(dr==-1) return 's';
        else if(dc==1) return 'w';
        else return 'e';
    }

    function positionNotConnected(tile) {
        var r = tile.row();
        var c = tile.col();

        if(roadPieces.length==0) {
            return (r>0 && r<numRows-1) &&
                (c>0 && c<numCols-1);
        } else {
            return !findRelativeLocation(tile,
                roadPieces[roadPieces.length-1]);
        }
    }

    function findSandwichOrientation(variable, f1, f2) {
        var loc1, loc2;
        loc1 = typeof f1=="string" ? f1 : findRelativeLocation(f1, variable);
        loc2 = typeof f2=="string" ? f2 : findRelativeLocation(f2, variable);
        return loc1 + loc2;
    }

    function updateRoad(tile, context) {
        var orientation = 'ew'; // default
        var nRoadPieces = roadPieces.length;

        // find and update orientation for newly added tile
        if (nRoadPieces==0) {
            // first road piece. Make sure it is jutting out ns if
            // starting from a col s.t. 0 < c < nCols-1
            if(tile.col() > 0 && tile.col() < numCols-1) {
                orientation = 'ns';    
            }
            
        } else {
            var curr = roadPieces[nRoadPieces-1];
            var nextLocation = findRelativeLocation(tile, curr);

            if(nextLocation=='n' || nextLocation=='s') {
                orientation = 'ns';
            }

            //TODO: if the newly added tile is the last piece of the road
            // and it is at the edge of the board, make it point to the edge
        }
        tile.image(roadTextures[orientation]);
        tile.update(context);
        
        // if we just added the first road piece, our job is done
        if(nRoadPieces==0) return;

        // update orientation for the previous road piece
        var variable, fixed;
        variable = roadPieces[nRoadPieces-1];
        if(nRoadPieces==1) {
            var r = variable.row();
            var c = variable.col();
            if(c==0) fixed = 'w';
            else if(c==numCols-1) fixed = 'e';
            else if(r==0) fixed = 'n';
            else if(r==numRows-1) fixed = 's';
        } else {
            fixed = roadPieces[nRoadPieces-2];
        }
        variable.image(roadTextures[findSandwichOrientation(variable, fixed, tile)]);
        variable.update(context);
    }
    
    board.tileAt = function(x, y) {
        var row = rowAt(y);
        var col = colAt(x);
        return tiles[row][col];
    }

    function rowAt(y) {
        return Math.floor(y/(tileh+gap));
    }
    
    function colAt(x) {
        return Math.floor(x/(tilew+gap));
    }
    
    return board;
}
