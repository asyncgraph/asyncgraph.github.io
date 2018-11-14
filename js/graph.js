function _assert(cond, msg){
  if(!cond) {
    alert("assertion failure "+msg);
    throw -1;
  }
}

function Node (id, tick, name, type, loc) {
  this.id = id; // a unique id
  this.name = name; // name of the node to be shown as a text element near the node
  this.type = type; // corresponds a type, can be used to show different shapes
  this.loc = loc; // source code location
  this.tick = tick; // the event loop tick this nodes belongs to

  this.outEdges = {}; // a map of edges starting from this node
  this.inEdges = {}; // a map of edges ending in this node
  this.hidden = false;
  this.dom = {
    node: undefined,
    warning: undefined,
    text: undefined
  }

  this._foreachEdge = function(edgeMap, cb) {
    for(var key in edgeMap) {
      var edgeArr = edgeMap[key];
      for(var edge of edgeArr) {
        if(cb(edge, key))
          return;
      }
    }
  }
  this.hide = function(){
    this.hidden = true;

    for(var key in this.dom) {
      if(this.dom[key]) {
        this.dom[key].attr("visibility", "hidden");
      }
    }
    this.foreachInEdge(function(edge, end){
      edge.hide();
    })
    this.foreachOutEdge(function(edge, end){
      edge.hide();
    })
  }
  this.addOutEdge = function (edge) {
    var to = edge.to;
    if(!this.outEdges[to.id]){
      this.outEdges[to.id] = [];
    }
    this.outEdges[to.id].push(edge);
  }
  this.addInEdge = function (edge) {
    var from = edge.from;
    if(!this.inEdges[from.id]){
      this.inEdges[from.id] = [];
    }
    this.inEdges[from.id].push(edge);
  }
  this.foreachInEdge = function(cb) {
    return this._foreachEdge(this.inEdges, cb);
  }
  this.foreachOutEdge = function(cb) {
    return this._foreachEdge(this.outEdges, cb);
  }
}

function Edge(id, from, to, clazz, label) {
  this.id = id;
  this.from = from; // the node where the edge starts
  this.to = to; // the node where the edge ends
  this.from.addOutEdge(this);
  this.to.addInEdge(this);
  this.clazz = clazz; // style class it has
  this.label = label;
  this.hidden = false;
  _assert(this.from);
  _assert(this.to);

  this.dom = {
    path: undefined,
    text: undefined,
  }

  this.hide = function(){
    this.hidden = true;

    for(var key in this.dom) {
      if(this.dom[key]){
        this.dom[key].attr("visibility", "hidden");
      }
    }
  }
}

function Tick(graph, id, name, label) {
  this.graph = graph;
  this.id = id; // a unique ID for the tick
  this.name = name; // name of the tick
  this.label = label; // label to be shown after click
  this.nodes = {}; // nodes belonging to this tick
  this.lastNode = undefined;
  this.addNode = function(id, name, type, loc) {
    var node = new Node(id, this, name, type, loc);
    this.nodes[id] = node;
    this.graph.nodes[id] = node;
    plotFuncs.onAddNode(this, node);
    this.lastNode = node;
    return node;
  }
}
var tickWidth = 250;
var TEXTWIDTH = 80; // to be updated
var TEXTHEIGHT = 50; // to be updated

class RectRegion {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

function Graph () {
  this.ticks = [];
  this.nodes = {};
  this.edges = {};
  this.addTick = function (id, name, label) {
    var newTick = new Tick(this, id, name, label);
    this.ticks.push(newTick);

    plotFuncs.onAddTick(newTick, id, name, label);

    return newTick;
  }
  this.addEdge = function (id, fromId, toId, clazz, label) {

    var edge = new Edge(id, this.nodes[fromId], this.nodes[toId], clazz, label);
    plotFuncs.onAddEdge(edge);
    return this.edges[id] = edge;
  }
}

var config = {
  height: 1280,
  width: 10800,
}

var markers = [
  { id: 0, name: 'circle', path: 'M 0,0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0', viewbox: '-6 -6 12 12' }
, { id: 1, name: 'square', path: 'M 0,0 m -5,-5 L 5,-5 L 5,5 L -5,5 Z', viewbox: '-5 -5 10 10' }
  , { id: 2, name: 'arrow', path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z', orient: 'auto', viewbox: '-5 -5 10 10' }
, { id: 2, name: 'stub', path: 'M 0,0 m -1,-5 L 1,-5 L 1,5 L -1,5 Z', viewbox: '-1 -5 2 10' }
]

var plotFuncs = {};

function loadLog(log){

  var graph = new Graph();

  d3.selectAll("#chart svg").remove();

  var svg = d3.select("#chart")
    .append("svg:svg")
      .attr("width", config.width)
      .attr("height", config.height)
      .attr("pointer-events", "all");

  svg.append("defs").selectAll("marker")
              .data(markers)
              .enter()
              .append('svg:marker')
                .attr('id', function(d){ return 'marker_' + d.name})
                .attr('markerHeight', 4)
                .attr('markerWidth', 4)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .attr('refX', 11)
                .attr('refY', 0)
                .attr('viewBox', function(d){ return d.viewbox })
                .append('svg:path')
                .attr('d', function(d){ return d.path })
                .attr('fill', function(d,i) { return d3.rgb(0,0,0)});


  var svg_g = svg.append("svg:g")

  // all edges are here
  var svg_g_edges = svg_g.append('svg:g')
  var svg_g_ticks = svg_g.append('svg:g')


  plotFuncs = {
    onAddTick: function(tick, id, name, label) {

      var tickG = svg_g_ticks.append('svg:g');
      tick.tickG = tickG;
      var leftPos = id * 100;
      var rightPos = (id + 1) * 100;
      //title
      tickG.append("g").append("text")
        .attr("x", tickWidth*id + tickWidth / 10)
        .attr("y", "1em")
        .text("T"+id)
      tickG.append("g").append("line")
        .attr("x1", tickWidth*id + tickWidth)
        .attr("y1", 0)
        .attr("x2", tickWidth*id + tickWidth)
        .attr("y2", config.height)
        .attr("class", "tick_border");
      tickG.append("g").attr("class", "tick_nodes")
    tickG.append("g").attr("class", "tick_warnings")
      tickG.append("g").attr("class", "tick_labels")
    },
    onAddNode: function(tick, node) {
      var tickG = tick.tickG;

      var nodeScale = 1; // a rough size of the node
      var circleSize = 12; // circle size
      var rectSize = {x: 10, y: 10};

      // to be replaced with a better position algorithm
      node.posX = tick.id * tickWidth + tickWidth * (0.2+0.7*Math.random());
      node.posY = (tick.lastNode?tick.lastNode.posY:0) + 50 + Math.random() * 50;

      var nodename = node.name;
      node.dom.text=tickG.select(".tick_labels").append("text").text(node.name)
        .attr('x', node.posX + circleSize/2).attr('y', node.posY);
      var n;
      // add style class
      switch(node.type) {
        case 'R':
          n = tickG.select(".tick_nodes").append("rect")
            .attr("class", "node node_reg")
            .attr("x", node.posX - rectSize.x/2)
            .attr("y", node.posY - rectSize.y/2)
            .attr("width", rectSize.x)
            .attr("height", rectSize.y)
          break;
        case 'C':
          n = tickG.select(".tick_nodes").append("circle")
            .attr("class", "node node_cb").attr("r", circleSize/2)
            .attr("cx", node.posX)
            .attr("cy", node.posY)
          break;
        case 'A':
          n = tickG.select(".tick_nodes").append("polygon")
            .attr("transform", "translate("+(node.posX-10)+" "+(node.posY-11)+") scale(0.1 0.1) ")
            .attr("class", "node node_action")
            .attr("points", "100,10 40,198 190,78 10,78 160,198")
          break;
        case 'X':
          n = tickG.select(".tick_nodes").append("polygon")
            .attr("transform", "translate("+(node.posX-10)+" "+(node.posY-11)+") scale(0.1 0.1) ")
            .attr("class", "node node_action")
            .attr("points", "100,10 40,198 190,78 10,78 160,198")
          break;
        default:
          //triangle for object bindings
          n = tickG.select(".tick_nodes").append("polygon")
            .attr("transform", "translate("+(node.posX-5)+" "+(node.posY+3)+") scale(0.1 0.1) ")
            .attr("class", "node node_obj")
            .attr("points", "0,0 100,0 50,-86")
          // throw 'unknown node type '+node.type;
          break;
      }
      n.attr("id", "node_"+node.id)
      function getCodeSnippet(data, loc, delim) {
        let codeLocation = loc.split(":");
        for(var i = 1; i <= 4; i++){
          codeLocation[i] = parseInt(codeLocation[i]);
        }
        var lines = data.split(delim);
        var code = "";
        if(codeLocation[1] == codeLocation[3]){
          code = lines[codeLocation[1]-1].substring(codeLocation[2]-1, codeLocation[4]-1);
        }else {
          code = lines[codeLocation[1]-1].substring(codeLocation[2]-1);
          // alert(code);
          for(var i = codeLocation[1]+1; i <= codeLocation[3]; i++){
            var line = lines[i-1];
            if(i != codeLocation[3]) {
              code += "\n"+line;
            }else{
              code += "\n"+line.substring(0, codeLocation[4]-1);
            }
          }
        }
        return code;
      }
      node.dom.node = n;
      n.on("click", function(){
        if(node.loc.startsWith("(*")){
          //internal code
          var loc = node.loc.substring(2, node.loc.length-1);
          var filepath = loc.substring(0, loc.indexOf(":"));
          // alert(filepath);
          var url = "https://raw.githubusercontent.com/graalvm/graaljs/e256e1f1b27d29a92fe59fab5cc54fff60bae4a4/graal-nodejs/lib/"+filepath;
          // alert(url);
          fetch(url).then(
            response =>{
              return response.text();
            }
          ).then(data =>{
            var code = getCodeSnippet(data,loc, '\n');
            alert(code);
          }).catch(err=>{
            alert(err);
          })

        }else {
          var loc = node.loc.substring(1, node.loc.length-1);
          var code = getCodeSnippet(myCodeMirror.getValue(),loc, '\n');
          alert(code);
        }
      });
    },
    onAddEdge: function(edge) {
      var e = svg_g_edges.append("path")
        .attr("class", "link link_"+edge.clazz)
        .attr("marker-end", 'url(#marker_arrow)')
        .attr("d", "M "+edge.from.posX+" "+edge.from.posY+" l "+(edge.to.posX-edge.from.posX)+" "+(edge.to.posY-edge.from.posY));
      edge.dom.edge = e;
    },
    onWarning: function(node, message) {

      var tickG = node.tick.tickG;
      node.dom.warning = tickG.select(".tick_warnings").append("text")
      .text("✗")
      .attr("fill","red").attr("class", "node_warning").attr("x", node.posX-15).attr("y", node.posY+5)
      .on("click", function(){
        alert(message);
      })

    }
  };


  /*
    L(oop) id name
    N(ode) R(egister) id name location loop
    N(ode) C(allback) id name location loop
    E(dge) xxx fromId toId label
  */
  var lines = log.split("\n");
  var lastTick, type, splitted;
  var edgeCnt = 0;
  var results = [];
  function checkValidLine(line) {
    if(line[0] != '[')
      return false;
    var text = line.substring(1, line.indexOf(']'));
    if(!text)
      return false;
    // var pid = text.split('-')[1];
    // alert(text);
    // if(parseInt(pid) > 0){
      return line.split(']')[1].indexOf('{') < 0;
    // }else {
      // return false;
    // }
  }
  lines.forEach(line => {
    if(checkValidLine(line)) {
      results.push(line);
      var tagSize = line.indexOf(']')+2;
      type = line[tagSize]
      splitted = line.substring(tagSize+2).split(',')
      switch(type){
        case 'L':
          var [id, name] = splitted;
          lastTick = graph.addTick(parseInt(id), name);
          break;
        case 'N':

          var [id, type, name, loc] = splitted;
          lastTick.addNode(id, name, type, loc);
          break;
        case 'X':
          var [id, key] = splitted;
          lastTick.addNode(id, "removal_"+key,"X");
          break;
        case 'E':
          break;
        case 'W':
          //warning
          var[id, msg] = splitted;
          plotFuncs.onWarning(graph.nodes[id], msg);
          break;
        default:
          console.error("warning unknown log entry type "+type);
      }
    }
  });
  lines.forEach(line => {
    if(checkValidLine(line)) {

      var tagSize = line.indexOf(']')+2;
      type = line[tagSize]
      splitted = line.substring(tagSize+2).split(',')
      switch(type){
        case 'E':
          var [type, from, to, label] = splitted;

          _assert(graph.nodes[from], "node "+from+" doesnot exsit! "+line);
          _assert(graph.nodes[to], "node "+to+" doesnot exsit! "+line);
          graph.addEdge(edgeCnt++, from, to, type, label);
          // edges.push({type, from, to, label})
          break;
      }
    }
  });
  for(var key in graph.nodes) {
    var node = graph.nodes[key];


    if(node.type == "A") { //action such as emit,resolve,reject should always have a callback execution

      if(node.name.startsWith("resolve") || node.name.startsWith("reject")){
        if(node.name.endsWith("_undefined")) {
          //a undefined value is returned in a promiss reaction
          var action = node.name.substring(0, node.name.length - "_undefined".length);
          node.dom.text.text(action);
          //warn if the resolve/reject has a reaction, otherwise it could be intentional
          if(Object.keys(node.outEdges).length > 0)
            plotFuncs.onWarning(node, "undefined action " +action+", forgot to return in promise reaction?");
        }else if(Object.keys(node.outEdges).length == 0) {
          //check if it is resolving to a catch or if it is inside a catch
          plotFuncs.onWarning(node, "missing reaction for the promise "+node.name);
        }
      }


      //dead emit
      if(Object.keys(node.outEdges).length == 0 && node.name.startsWith("emit")){
        if(node.name != "emit:beforeExit" && node.name != "emit:exit")
          plotFuncs.onWarning(node, "dead action "+node.name);
      }
    }

    if(node.type == "R") {
      var dead = true;
      node.foreachOutEdge(function(edge, end){
        if(graph.nodes[end].type == 'C' || graph.nodes[end].type == 'A' || node.name=="Promise.catch")
          dead = false;
        return !dead;
      })
      if(dead)
        plotFuncs.onWarning(node, "dead listener");
    }

    if(node.type == "P") {
      var numOut = 0, numIn = 0;
      node.foreachOutEdge(function(edge, end){
        numOut++;
      });
      node.foreachInEdge(function(edge, end){
        numIn++;
        if(edge.label == 'creates'){
          node.promiseReg = graph.nodes[end];
          if(graph.nodes[end].name.startsWith("Promise.then")){
            graph.nodes[end].dom.text.text(graph.nodes[end].name.substring(0, graph.nodes[end].name.length-3))
          }
        }
        //TODO PA need to be infered from the graph
        if(edge.clazz=='PA'){
          node.hasAction = true;
        }
        if(edge.label=='link' || edge.label=='action'){
          graph.nodes[end].hasAction = true;
        }
      })

      if(numIn == 0 && numOut ==0 ){
        node.hide();
      }else {

        if(!node.hasAction) {
          if(node.promiseReg && node.promiseReg.name != "Promise.catch" && !node.promiseReg.name.startsWith("Promise.then")) {
            // alert(_node.promiseReg.name);
            plotFuncs.onWarning(node, "dead promise");
          }
        }

        //tail of a promise chain
        var tail = true;
        node.foreachOutEdge(function(edge, end){
          if(graph.nodes[end].type=='P') {
            tail = false;
            return true;
          }
        })
        if(tail){
          warningMsgs = [];

          var hasCatch = false;
          var nonCreationAction = [];
          node.foreachInEdge(function(edge, end) {
            if(graph.nodes[end].name == "Promise.catch")
            {
              hasCatch = true;
            }
            if(edge.label != "creates") {
              nonCreationAction.push(edge.label);
            }
          })

          if(nonCreationAction.length == 0) {
            warningMsgs.push("Dead promise");
          }

          if(!hasCatch) {
            warningMsgs.push("Missing catch at the end of a promise chain");
          }

          if(warningMsgs.length > 0) {
            plotFuncs.onWarning(node, warningMsgs.join("\n"));
          }
        }
      }
    }
  }

  //to hide
  while(false) {
    var stable = true;
    for(var key in graph.nodes) {
      var node = graph.nodes[key];

      // TODO, PA need to be infered here
      if(node.type=='P') {
        node.foreachInEdge(function(edge, end){
          if(edge.clazz == "PA"){
            //helper edge remove
            if(!edge.hidden)
            {
              edge.hide();
              stable = false;
            }
          }
        })
      }

      if(node.type == "R") { //action such as emit,resolve,reject should always have a callback execution
        var cbNodes = [];
        node.foreachOutEdge(function(edge, end) {
          // if(end.type == 'C'){
            cbNodes.push(end);
          // }
        })
        var objNode;
        var happenInNode;
        node.foreachInEdge(function(edge, end) {
          if(edge.clazz == 'O'){
            objNode = end;
          }else if(edge.clazz == 'H') {
            happenInNode = end;
          }
        })
        //exclude dead registration in an internal callback
        if(cbNodes.length == 0) {
          if(happenInNode && (!happenInNode.loc || happenInNode.loc.startsWith("(*"))) {
            if(!node.hidden) {
              node.hide();
              stable = false;
            }
          }
        }
      }

      if(node.type == 'E') {
        node.foreachOutEdge(function(edge, end) {
          if(edge.label == "emit") {
            // alert(edge);
            if(!graph.nodes[end].dom.warning) {
              if(!edge.hidden) {
                edge.hide();
                stable = false;
              }
            }else if (graph.nodes[end].loc.startsWith("(*")) {
              graph.nodes[end].hide();
            }
          }
        })
      }

      if(node.type == 'E') {
        var shouldHide = true;
        node.foreachOutEdge(function(edge, end){
          if(!graph.nodes[end].hidden)
            shouldHide = false
        })
        if(shouldHide)
        if(!node.hidden) {
          node.hide();
          stable = false;
        }
      }
    }
    if(stable)
      break;
  }
  return results;

}
