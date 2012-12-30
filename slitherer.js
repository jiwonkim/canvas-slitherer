var field = window.field = {};

field.tile = function() {
    var row, col, width, height, gap;
    var isRoad = false;

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
        context.drawImage(
            image,
            col*(width+gap),
            row*(height+gap),
            width, height
        );
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
        if(val!=undefined) {
            isRoad = val;
            return tile;
        }
        return isRoad; 
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

    board.addRoadPiece = function(tile, context) {
        roadPieces.push(tile);
        updateRoadTexture(tile, context);
    }

    // returns 'n', 's', 'e', 'w' that describes tile's location
    // relative to adjacent
    function findRelativeLocation(tile, adjacent) {
        var tr = tile.row(); 
        var tc = tile.col();
        var ar = adjacent.row();
        var ac = adjacent.col();

        if(ar-tr==1) return 'n';
        else if(ar-tr==-1) return 's';
        else if(ac-tc==1) return 'w';
        else if(ac-tc==-1) return 'e';
        
        return ''; // not adjacent
    }

    function updateRoadTexture(tile, context) {
        // iterates through the road pieces, and finds the best road
        // texture (orientation) for the newly added tile
        var orientation = 'ew'; // default
        var nRoadPieces = roadPieces.length;

        if (nRoadPieces > 1) {
            var curr = roadPieces[nRoadPieces-2];
            var cr = curr.row();
            var cc = curr.col();
            var nr = tile.row();
            var nc = tile.col();
            if (Math.abs(nr-cr)==1) {
                orientation = 'ns';
            }

            if (curr.image().orientation != orientation && nRoadPieces > 2) {
                var prev = roadPieces[roadPieces.length-3];
                var prevLocation = findRelativeLocation(prev, curr);
                var nextLocation = findRelativeLocation(tile, curr);
                
                console.log(prevLocation+","+nextLocation);

                if(prevLocation!='') {
                    curr.image(roadTextures[prevLocation+nextLocation]);
                    curr.update(context);
                }
            }
        }
        tile.image(roadTextures[orientation]);
        tile.update(context);
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
