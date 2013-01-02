var slitherer = window.slitherer = function() {
    //TODO Make field into a closure with multiple layers of canvases
    var mode = 'roads';
    var action = 'build';
    var tool = 'add';
    var contexts = {};
    var cursors = {};
    var width, height, board, coven;
    var selectedSnake, selectedLadder, selectedRoad;

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
        ['roads', 'snakes', 'ladders', 'play'].forEach(function(mode) {
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
            .context(contexts['roads'])
            .create()
            .update(contexts['roads']);

        // init board
        board();

        coven = slitherer.coven()
            .context(contexts['snakes'])
            .width(width).height(height)
            .tilewidth(Math.floor(board.tilewidth()+1)) // add gap
            .tileheight(Math.floor(board.tileheight()+1));

        woodshed = slitherer.woodshed()
            .context(contexts['ladders'])
            .width(width).height(height)
            .tilewidth(Math.floor(board.tilewidth()+1)) // add gap
            .tileheight(Math.floor(board.tileheight()+1));

        return field;
    }
    field.width = function() {
        return width;
    }
    field.height = function() {
        return height;
    }

    field.tilewidth = function() {
        return Math.floor(board.tilewidth()+1);
    }
    field.tileheight = function() {
        return Math.floor(board.tileheight()+1);
    }

    field.mode = function(val) {
        if(val==undefined) return mode;
        mode = val;
        return field;
    }

    field.action = function(val) {
        if(val==undefined) return action;
        action = val;
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
        if(layer=='ladders') woodshed.clear();
        else contexts[layer].clearRect(0, 0, width, height);
    }
    
    field.displayCursor = function(x, y) {
        field.clearLayer('cursor');
        if(action=='build') contexts['cursor'].drawImage(cursors[mode], x, y);
        else contexts['cursor'].drawImage(cursors[action], x, y);
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

    field.endRoad = function() {
        try {
            return board.endRoad();
        } catch(err) {
            throw err;
        }
    }

    field.selectSnake = function(val) {
        selectedSnake = val;
    }

    field.addSnake = function(x, y) {
        if(!board.tileAt(x, y).isRoad()) {
            throw {'type': 'error', 'message': "The head and tail of a snake need to touch the road"};
        } else {
            coven.addSnake(x, y);
            field.selectSnake(coven.getLastSnake());
        }
    }

    field.updateSnake = function(x, y, drawGuide) {
        coven.updateSnake(selectedSnake, x, y, drawGuide);
    }
    
    field.endSnake = function(x, y) {
        field.updateSnake(x, y, false);
        if(!board.tileAt(x, y).isRoad()) {
            if(selectedSnake) {
                coven.removeSnake();
                selectedSnake = null;
            }
            throw {'type': 'error', 'message': "The head and tail of a snake need to touch the road"};
        }
        if(selectedSnake) {
            var start = selectedSnake.start();
            var end = selectedSnake.end();
            var n1 = board.tileAtRowAndCol(start.row, start.col).roadNumber();
            var n2 = board.tileAtRowAndCol(end.row, end.col).roadNumber();

            if (n1 < n2) {
                selectedSnake.start(end.row, end.col);
                selectedSnake.end(start.row, start.col);
                coven.update();
            } else if(n1==n2) {
                coven.removeSnake();
                selectedSnake = null;
                throw {'type': 'error', 'message': "A snake cannot begin and end on the same tile."};
            }

        }
        selectedSnake = null;
    }
    
    field.selectLadder = function(val) {
        selectedLadder = val;
    }

    field.addLadder = function(x, y) {
        if(!board.tileAt(x, y).isRoad()) {
            throw {'type': 'error', 'message': "The top and bottom of a ladder need to touch the road"};
        } else {
            woodshed.addLadder(x, y);
            field.selectLadder(woodshed.getLastLadder());
        }
    }

    field.updateLadder = function(x, y, drawGuide) {
        woodshed.updateLadder(selectedLadder, x, y, drawGuide);
    }
    
    field.endLadder = function(x, y) {
        field.updateLadder(x, y, false);
        if(!board.tileAt(x, y).isRoad()) {
            if(selectedLadder) {
                woodshed.removeLadder();
                selectedLadder = null;
            }
            throw {'type': 'error', 'message': "The top and bottom of a ladder need to touch the road"};
        }
        if(selectedLadder) {
            var start = selectedLadder.start();
            var end = selectedLadder.end();
            var n1 = board.tileAtRowAndCol(start.row, start.col).roadNumber();
            var n2 = board.tileAtRowAndCol(end.row, end.col).roadNumber();

            if (n1==n2) {
                woodshed.removeLadder();
                selectedLadder = null;
                throw {'type': 'error', 'message': "A ladder cannot begin and end on the same tile."};
            }

        }
        selectedLadder = null;
    }

    field.getRoads = function() {
        return board.roads(); 
    }
    field.getSnakes = function() {
        return coven.snakes();
    }
    field.getLadders = function() {
        return woodshed.ladders();
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
    coven.snakes = function() {
        return snakes;
    }
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
        snakes.push(slitherer.stretchyProp()
            .tilewidth(tilewidth).tileheight(tileheight).bodyLength(100)
            .start(Math.floor(y/tileheight), Math.floor(x/tilewidth))
            .background(head, body, tail));

        var snake = snakes[snakes.length-1];
        return coven;
    }
    coven.updateSnake = function(snake, x, y, drawGuide) {
        if(!snake) return;
        snake.end(Math.floor(y/tileheight), Math.floor(x/tilewidth));
        snake.drawGuide(drawGuide);
        coven.update();
        return coven;
    }
    coven.update = function() {
        context.clearRect(0, 0, width, height);

        snakes.forEach(function(snake){
            snake.draw(context, snake.drawGuide()); 
        });
    }
    coven.removeSnake = function(idx) {
        snakes.splice(snakes.length-1, 1);
        coven.update();
    }
    return coven;
}

slitherer.woodshed = function() {
    var context, width, height, tilewidth, tileheight;
    var head = new Image();
    head.src = 'images/ladderhead.png';
    head.loaded = false;
    head.onLoad = function() { head.loaded = true; };

    var body = new Image();
    body.src = 'images/ladderbody.png';
    body.loaded = false;
    body.onLoad = function() { body.loaded = true; };

    var tail = new Image();
    tail.src = 'images/laddertail.png';
    tail.loaded = false;
    tail.onLoad = function() { tail.loaded = true; };

    var ladders = [];
    var woodshed = {};
    woodshed.ladders = function() {
        return ladders;
    }
    woodshed.context = function(val) {
        if(val==undefined) return context;
        context = val;
        return woodshed;
    }
    woodshed.clear = function() {
        ladders = [];
        context.clearRect(0, 0, width, height);
    } 
    woodshed.width = function(val) {
        if(val==undefined) return val;
        width = val;
        return woodshed;
    }
    woodshed.height = function(val) {
        if(val==undefined) return val;
        height = val;
        return woodshed;
    }
    woodshed.tilewidth = function(val) {
        tilewidth = val;
        return woodshed;
    }
    woodshed.tileheight = function(val) {
        tileheight = val;
        return woodshed;
    }
    woodshed.getLastLadder = function() {
        return ladders[ladders.length-1];
    }
    woodshed.addLadder = function(x,y) {
        ladders.push(slitherer.stretchyProp().bodyLength(40)
            .tilewidth(tilewidth).tileheight(tileheight)
            .start(Math.floor(y/tileheight), Math.floor(x/tilewidth))
            .background(head, body, tail));

        var ladder = ladders[ladders.length-1];
        return woodshed;
    }
    woodshed.updateLadder = function(ladder, x, y, drawGuide) {
        if(!ladder) return;
        ladder.end(Math.floor(y/tileheight), Math.floor(x/tilewidth));
        ladder.drawGuide(drawGuide);
        woodshed.update();
        return woodshed;
    }
    woodshed.update = function() {
        context.clearRect(0, 0, width, height);

        ladders.forEach(function(ladder){
            ladder.draw(context, ladder.drawGuide()); 
        });
    }
    woodshed.removeLadder = function(idx) {
        ladders.splice(ladders.length-1, 1);
        woodshed.update();
    }
    return woodshed;
}

slitherer.stretchyProp = function() {
    var tilewidth, tileheight, bodyLength;
    var drawGuide;

    var start, end;
    var head, body, tail;
    var prop = {};
    prop.background = function(h, b, t) {
        head = h;
        body = b;
        tail = t;
        return prop; 
    }
    prop.bodyLength = function(val) {
        if(val==undefined) return bodyLength;
        bodyLength = val;
        return prop;
    }
    prop.tilewidth = function(val) {
        if(val==undefined) return tilewidth;
        tilewidth = val; 
        return prop;
    }
    prop.tileheight = function(val) {
        if(val==undefined) return tileheight;
        tileheight = val; 
        return prop;
    }
    prop.start = function(row, col) {
        if(row==undefined) return start;
        start = {'row': row, 'col': col};
        return prop;
    }
    prop.end = function(row, col) {
        if(row==undefined) return end;
        end = {'row': row, 'col': col};
        return prop;
    }
    prop.drawGuide = function(val) {
        if(val==undefined) return drawGuide;
        drawGuide = val;
        return prop;
    }
    prop.draw = function(context, drawGuide) {
        var startx = tilewidth*start.col + tilewidth/2;
        var starty = tileheight*start.row + tileheight/2;

        var endx = tilewidth*end.col + tilewidth/2;
        var endy = tileheight*end.row + tileheight/2;

        drawProp(context, startx, starty, endx, endy);
        if(drawGuide) drawEditableGuide(context, startx, starty, endx, endy);
    }

    function drawEditableGuide(context, startx, starty, endx, endy) {
        var radius = 10;
        
        context.beginPath();
        context.arc(startx, starty, radius, 0, 2*Math.PI);
        context.fillStyle = 'rgba(255, 0, 0, 0.5)';
        context.fill();
        context.closePath();

        context.beginPath();
        context.arc(endx, endy, radius, 0, 2*Math.PI);
        context.fillStyle = 'rgba(0, 255, 255, 0.5)';
        context.fill();
        context.closePath();
    }

    function drawProp(context, startx, starty, endx, endy) {
        // get rotation of line
        var dx = endx - startx;
        var dy = starty - endy; // in canvas, y grows down
        var theta = Math.atan(dy/dx);

        // draw head
        context.save();
        context.translate(startx, starty);
        if(dx>=0) context.rotate(Math.PI-theta);
        else context.rotate(Math.PI*2-theta);
        context.translate(-tilewidth/2, -tileheight/2);
        context.drawImage(head, 0, 0, tilewidth, tileheight);
        context.restore();

        // draw tail
        context.save();
        context.translate(endx, endy);
        if(dx>=0) context.rotate(Math.PI-theta);
        else context.rotate(Math.PI*2-theta);
        context.translate(-tilewidth/2, -tileheight/2);
        context.drawImage(tail, 0, 0, tilewidth, tileheight);
        context.restore();

        // draw body
        // find total body length
        var length = Math.sqrt(dx*dx + dy*dy) - tilewidth;

        // find total body tiles to repeat
        var numBodies = Math.floor(length/bodyLength + 1);

        context.save();
        context.translate(startx, starty);
        if(dx>=0) context.rotate(Math.PI-theta);
        else context.rotate(Math.PI*2-theta);

        context.translate(-tilewidth/2, -tileheight/2);
        for(var i=0; i<numBodies; i++) {
            var offset = length/numBodies;
            context.translate(-offset, 0);
            context.drawImage(body, 0, 0, offset, tileheight);
        }
        context.restore();

    }
    return prop;
}

slitherer.tile = function() {
    var row, col, width, height, gap, image, x, y;
    var isRoad = false;
    var drawGuide = false;
    var roadNumber = 0;
    
    function tile(context) {
        x = col*(width+gap);
        y = row*(height+gap);
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

    tile.x = function() {   
        return x;
    }
    tile.y = function() {   
        return y;
    }

    tile.image = function(val) {
        if(val==undefined) return image;
        image = val;
        return tile;
    }
    
    tile.update = function(context, drawGuide) {
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

    tile.drawGuide = function(val) {
        if(val==undefined) return drawGuide;
        drawGuide = val;
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
    var width, height, numRows, numCols, gap, board;
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

    board.context = function(val) {
        if(val==undefined) return context;
        context = val;
        return board;
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
            if(roadPieces.length==0) {
                throw {'type': 'error', 'message': "Please start the road at the edge of the board."};
            } else {
                throw {'type': 'error', 'message': "Please continue the road where it left off."};
            }
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

    board.endRoad = function() {
        var nRoadPieces = roadPieces.length;
        if(nRoadPieces==0) return false;

        var last = roadPieces[nRoadPieces-1];
        if(nRoadPieces==1 || !isOnEdge(roadPieces[nRoadPieces-1])) {
            throw {'type': 'warning', 'message': 'Road does not lead anywhere. Please complete your road!'};
        } else {
            var exit;
            if(last.col()==0) exit = 'w';
            else if(last.col()==numCols-1) exit = 'e';
            else if(last.row()==0) exit = 'n';
            else exit = 's';

            var orientation = findSandwichOrientation(last,
                roadPieces[nRoadPieces-2], exit);

            last.image(roadTextures[orientation]);
            last.update(context, false);
            return true;
        }
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

    function isOnEdge(tile) {
        var r = tile.row();
        var c = tile.col();
        return (r==0 || r==numRows-1 || c==0 || c==numCols-1);
    }

    function positionNotConnected(tile) {
        if(roadPieces.length==0) {
            return !isOnEdge(tile);
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
        tile.update(context, 'rgba(255, 0, 0, 0.5)');
        
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
        variable.update(context, false);
    }
    board.tileAt = function(x, y) {
        var row = rowAt(y);
        var col = colAt(x);
        return board.tileAtRowAndCol(row, col);
    }
    board.tileAtRowAndCol = function(r, c) {
        return tiles[r][c];
    }
    board.roads = function() {
        return roadPieces;
    }

    function rowAt(y) {
        return Math.floor(y/(tileh+gap));
    }
    
    function colAt(x) {
        return Math.floor(x/(tilew+gap));
    }
    
    return board;
}

slitherer.game = function() {
    var numPlayers, playing;
    var players = [];
    var path = [];
    var turn = 0;
    var width, height, tilewidth, tileheight, gameContext;
    var winner = false;

    var game = {};
    game.playing = function(val) {
        if(val==undefined) return playing;
        playing = val;
        return game;
    }
    game.turn = function(val) {
        if(val==undefined) return turn;
        turn = val;
        return game;
    }
    game.passTurn = function() {
        turn = (turn+1)%numPlayers;
        return game;
    }
    game.width = function(val) {
        if(val==undefined) return width;
        width = val;
        return game;
    }
    game.height = function(val) {
        if(val==undefined) return height;
        height = val;
        return game;
    }
    game.tilewidth = function(val) {
        if(val==undefined) return tilewidth;
        tilewidth = val;
        return game;
    }
    game.tileheight = function(val) {
        if(val==undefined) return tileheight;
        tileheight = val;
        return game;
    }
    game.init = function(roads, snakes, ladders, playerNames, playerAvatars, context) {
        gameContext = context;
        console.log(playerNames);
        console.log(playerAvatars);
        numPlayers = playerNames.length;

        // init list of game blocks
        var roadMap = {};
        roads.forEach(function(road) {
            var r, c, x, y;
            r = road.row();
            c = road.col();
            x = road.x(); 
            y = road.y();
            var block = slitherer.gameBlock()
                .width(tilewidth).height(tileheight)
                .row(r).col(c).x(x).y(y);

            var key = String(r) + ' ' + String(c);
            roadMap[key] = block;
            path.push(block);
            console.log(block.width());
            console.log(block.height());
        });

        snakes.forEach(function(snake) {
            var sr, sc;
            sr = snake.start().row;
            sc = snake.start().col;
            
            var er, ec;
            er = snake.end().row;
            ec = snake.end().col;

            roadMap[String(sr) + ' ' + String(sc)].snakeTo(
                path.indexOf(roadMap[String(er) + ' ' + String(ec)])
            );
        });

        ladders.forEach(function(ladder) {
            var sr, sc;
            sr = ladder.start().row;
            sc = ladder.start().col;
            
            var er, ec;
            er = ladder.end().row;
            ec = ladder.end().col;

            var startBlock = roadMap[String(sr) + ' ' + String(sc)];
            var sidx = path.indexOf(startBlock);
            var endBlock = roadMap[String(er) + ' ' + String(ec)];
            var eidx = path.indexOf(endBlock);
            
            if(sidx < eidx) {
                startBlock.ladderTo(eidx);
            } else {
                endBlock.ladderTo(sidx);
            }
        });

        // init players
        for(var i=0; i<numPlayers; i++) {
            var player = slitherer.player()
                .context(context)
                .name(playerNames[i])
                .avatar(playerAvatars[i])
                .block(path[0])
                .position(0)
                .draw();

            players.push(player);
        }

        return game;
    }
    game.play = function(roll) {
        if(winner) return;
        playing = true;
        var player = players[turn];
        var block;
        var move = setInterval(function() {
            // move player forward
            // update player's position
            if(--roll == 0) clearInterval(move);

            if(player.position()==path.length) {
                clearInterval(move);
                console.log("Player "+player.name()+" wins!");
                winner = player;
            }
            player.position(player.position()+1);
            player.block(path[player.position()]);
            console.log("Player has moved to: "+player.position());
            update();

            if(roll==0) endMove(player);

        }, 500);
    }
    function endMove(player) {
        console.log("Ending move at: "+player.position());
        var block = player.block();
        var destination = block.snakeTo() ? block.snakeTo() : block.ladderTo();
        if(destination) {
            slide(block, path[destination], player, function() {
                player.position(destination);
                player.block(path[destination]);
                playing = false;
            });
        } else {
            playing = false;
        }
    }
    function update(except) {
        gameContext.clearRect(0, 0, width, height); 
        players.forEach(function(player) {
            if(!except || except.indexOf(player)==-1) {
                player.draw();
            }
        });
    }
    function slide(from, to, player, callback) {
        var t = 0;
        var x = from.x();
        var y = from.y();
        var dx = to.x() - from.x();
        var dy = to.y() - from.y();
        var slide = setInterval(function() {
            update([player]);
            player.drawAt(x + dx*t, y + dy*t);
            if(t==1.0) {
                clearInterval(slide);
                callback();
            }

            t += 0.05;
            if(t>1) t = 1.0;
        }, 50);
    }
    return game;
}

slitherer.gameBlock = function() {
    var row, col, x, y, snakeTo, ladderTo, width, height;
    var block = {};
    block.row = function(val) {
        if(val==undefined) return row;
        row = val;
        return block;
    }
    block.col = function(val) {
        if(val==undefined) return col;
        col = val;
        return block;
    }
    block.x = function(val) {
        if(val==undefined) return x;
        x = val;
        return block;
    }
    block.y = function(val) {
        if(val==undefined) return y;
        y = val;
        return block;
    }
    block.width = function(val) {
        if(val==undefined) return width;
        width = val;
        return block;
    }
    block.height = function(val) {
        if(val==undefined) return height;
        height = val;
        return block;
    }
    block.snakeTo = function(val) {
        if(val==undefined) return snakeTo;
        snakeTo = val;
        return block;
    }
    block.ladderTo = function(val) {
        if(val==undefined) return ladderTo;
        ladderTo = val;
        return block;
    }
    return block;
}

slitherer.player = function() {
    var name, block, avatar, context, position;
    var player = {};
    player.position = function(val) {
        if(val==undefined) return position;
        position = val;
        return player;
    }
    player.name = function(val) {
        if(val==undefined) return name;
        name = val;
        return player;
    }
    player.avatar = function(val) {
        if(val==undefined) return avatar;
        avatar = val;
        return player;
    }
    player.context = function(val) {
        if(val==undefined) return context;
        context = val;
        return player;
    }
    player.block = function(val) {
        if(val==undefined) return block;
        block = val;
        return player;
    }
    player.draw = function() {
        player.drawAt(block.x(), block.y());
        return player;
    }
    player.drawAt = function(x, y) {
        context.drawImage(avatar, x, y, block.width(), block.height());
        return player;
    }
    return player;
}
