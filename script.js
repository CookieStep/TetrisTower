var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");

var {
    Engine,
    Bodies,
    Body,
    Render,
    Constraint,
    Composite
} = Matter;

// create an engine
var engine = Engine.create({
    // enableSleeping: true
});
var collisionGroups = {
    default: 0b1
};
function createPiece(piece) {
    var pieceName = piece;
    var I, J, T, L, O, S, Z;
    I = piece == "i";
    J = piece == "j";
    T = piece == "t";
    L = piece == "l";
    O = piece == "o";
    S = piece == "s";
    Z = piece == "z";

    var colors = {
        i: "#0ff",
        j: "#00f",
        l: "#f70",
        t: "#f0f",
        s: "#0f0",
        z: "#f00",
        o: "#ff0"
    };

    var options2 = () => ({
        friction: .5,
        frictionAir: .1,
        restitution: 0,
        mass: 3
    });
    var options = () => ({
        chamfer: {radius: 5},
        render: {
            // fillStyle: "#0000",
            fillStyle: colors[piece],
            // lineWidth: 1
        }
    });
    
    if(I) {
        piece = Body.create({parts: [
            Bodies.rectangle(40, 100, 20, 20, options()),
            Bodies.rectangle(60, 100, 20, 20, options()),
            Bodies.rectangle(80, 100, 20, 20, options()),
            Bodies.rectangle(100, 100, 20, 20, options())
        ], ...options2()});
    }
    if(J || T || L) {
        var x = 0;
        if(J) x = 60;
        if(T) x = 80;
        if(L) x = 100;

        piece = Body.create({parts: [
            Bodies.rectangle(x, 80, 20, 20, options()),
            Bodies.rectangle(60, 100, 20, 20, options()),
            Bodies.rectangle(80, 100, 20, 20, options()),
            Bodies.rectangle(100, 100, 20, 20, options())
        ], ...options2()});
    }
    if(O) {
        piece = Body.create({parts: [
            Bodies.rectangle(60, 80, 20, 20, options()),
            Bodies.rectangle(80, 80, 20, 20, options()),
            Bodies.rectangle(80, 100, 20, 20, options()),
            Bodies.rectangle(60, 100, 20, 20, options())
        ], ...options2()});
    }
    if(S | Z) {
        var a = Z? 80: 100;
        var b = S? 80: 100;
        piece = Body.create({parts: [
            Bodies.rectangle(60, a, 20, 20, options()),
            Bodies.rectangle(80, a, 20, 20, options()),
            Bodies.rectangle(100, b, 20, 20, options()),
            Bodies.rectangle(80, b, 20, 20, options())
        ], ...options2()});
    }
    Body.translate(piece, Matter.Vector.create(120, -120));
    Composite.add(engine.world, [piece]);
    piece.name = pieceName;
    return piece;
}

var ground = Bodies.rectangle(200, 610, 200, 60, {isStatic: true});

// add all of the bodies to the world
Composite.add(engine.world, [ground]);

var render;
var backgroundCanvas = document.createElement('canvas');
var pen = backgroundCanvas.getContext("2d");
onload = () => {
    // document.body.appendChild(canvas);
    // create a renderer
    render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false
        }
    });
    
    // run the renderer
    // Render.run(render);

    update();
}
var txt = 'iszotjl';
var order = [];
var shuffle = ([...arr]) => {
    var n = [];
    while(arr.length) {
        var i = Math.random()*arr.length;
        n.push(...arr.splice(i, 1));
    }
    return n;
};
var summon = () => {
    piece = order.shift();
    return createPiece(piece);
};
// summon();
// setInterval(summon, 500);

var keys = new (class Keys extends Map {
    use(code) {
        return this.get(code) == 1 && this.set(code, 2);
    }
    multi(code) {
        return this.get(code) & 1 && this.set(code, 2);
    }
});

onkeydown = ({code}) => keys.set(code, 1);
onkeyup = ({code})   => keys.delete(code);

function place() {
    Body.set(mainPiece, "frictionAir", 0);
    mainPiece = 0;
}
function updateMainPiece() {
    var spd = 0.07;
    if(keys.has("ArrowLeft")) {
        Body.applyForce(mainPiece, mainPiece.position, {x: -spd, y: 0});
    }
    if(keys.has("ArrowRight")) {
        Body.applyForce(mainPiece, mainPiece.position, {x: +spd, y: 0});
    }
    if(keys.has("ArrowUp")) {
        Body.set(mainPiece, "torque", .5);
    }
    if(keys.has("KeyZ")) {
        Body.set(mainPiece, "torque", -.5);
    }
    if(keys.has("ArrowDown")) {
        Body.set(mainPiece, "frictionAir", 0.01);
    }else{
        Body.set(mainPiece, "frictionAir", .1);
    }
    if(keys.use("Space") || mainPiece.isSleeping) {
        place();
    }
}

var mainPiece;

var steps = 20;
var pieceDelay = 0;
function update() {
    if(order.length < 7) order.push(...shuffle(txt));
    updateWaiting();
    if(pieceDelay) {
        --pieceDelay;
    }
    if(!mainPiece && !pieceDelay) {
        mainPiece = summon();
        pieceDelay = 20;
    }
    if(mainPiece) {
        updateMainPiece();
    }
    for(let i = 0; i < steps; i++) {
        Engine.update(engine, 20/steps);
    }
    var piecesUsed = 0;
    for(let body of engine.world.bodies) {
        if(body.position.y > 610) {
            Composite.remove(engine.world, body);
            if(!body.upcoming) {
                piecesLost += 1;
            }
        }else{
            if(!body.isStatic && !body.upcoming) {
                ++piecesUsed;
            }
            if(!body.upcoming) {
                if(body.position.y > -0 && getMotion(body) < 0.01 && body != mainPiece) {
                    let height = body.bounds.min.y;
                    if(tallestTower > height) {
                        tallestTower = height;
                    }
                }
            }
        }
    }
    Render.world(render);
    {
        var canvas = render.canvas;
        var ctx = render.context;
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial'
        ctx.fillText("Pieces lost: " + piecesLost, 5, 30);
        ctx.fillText("Piece count: " + piecesUsed, 5, 60);
        ctx.fillText("Tallest tower: " + Math.floor((580 - tallestTower)*10)/100, 5, 90);
        ctx.fillStyle = '#0005'
        var y = tallestTower;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }
    requestAnimationFrame(update);
}
function getMotion(body) {
    return body.speed**2 + body.angularSpeed**2;
}
var piecesLost = 0;
var tallestTower = 2000;

var waitingPieces = [];
var spawnDelay = 0;
function updateWaiting() {
    if(waitingPieces[0] && waitingPieces[0].name == mainPiece?.name) {
        var piece = waitingPieces.shift();
        Body.set(piece, 'frictionAir', 0);
        Composite.remove(engine.world, piece.pull);
    }

    var len = Math.min(order.length, 5);
    if(spawnDelay) --spawnDelay;
    else if(waitingPieces.length < len) {
        piece = createPiece(order[waitingPieces.length]);

        Body.set(piece, 'frictionAir', .02);
        Body.set(piece, 'restitution', .5);
        Body.set(piece, "torque", 1);
        piece.upcoming = 1;
        piece.collisionFilter.mask = 2;
        piece.collisionFilter.category = 2;

        var l = 80 + 40 * waitingPieces.length;
        Body.setPosition(piece, {x: 600+l, y: 0});
        var pull = Constraint.create({
            pointA: {x: 600, y: 0},
            bodyB: piece,
            pointB: {x: 0, y: 0},
            stiffness: .01,
            render: {visible: false, type: 'line'},
            length: l
        });
        Composite.add(engine.world, pull);
        piece.pull = pull;
        waitingPieces.push(piece);
        spawnDelay = 10;
    }
    for(let i = 0; i < waitingPieces.length; i++) {
        let piece = waitingPieces[i];
        piece.pull.length = 80 + 40 * i;
    }
}
