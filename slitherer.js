var field = window.field = {};

field.tile = function() {
    var row, col, width, height, gap;
    var isRoad = false;
    var roadNumber = 0;

    // default tile background
    var image = new Image();
    image.src = 'images/grass.jpg';
    image.loaded = false;
    image.onLoad = function() {
        image.loaded = true;
    }

    function tile(context) {
        if(!image.loaded) {
            setTimeout(function() { tile(context); }, 10);
        }
        
        var x = col*(width+gap);
        var y = row*(height+gap);
        context.drawImage(image, x, y, width, height);

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

field.board = function() {
    var width, height, numRows, numCols, gap;
    var tilew, tileh;
    var tiles = [];
    var path = [];
    var roadPieces = [];
    var roadTextures = {};

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

    board.create = function() {
        // create board
        tilew = (width - gap*(numCols-1)) / numCols;
        tileh = (height - gap*(numRows-1)) / numRows;

        for(var r=0; r<numRows; r++) {
            tiles[r] = [];
            for(var c=0; c<numCols; c++) { 
                tiles[r][c] = field.tile()
                    .row(r).col(c)
                    .width(tilew).height(tileh)
                    .gap(gap);
            }
        }  
        return board;
    }

    board.clear = function(context) {
        context.clearRect(0, 0, width, height);
        return board;
    }

    board.update = function(context) {
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

field.init = function(canvas, nrows, ncols) {
    var context = canvas.getContext('2d');
    var board = field.board()
        .width(canvas.width)
        .height(canvas.height)
        .gap(1)
        .numRows(nrows)
        .numCols(ncols)
        .create()
        .update(context);

    board();

    return board;
}
