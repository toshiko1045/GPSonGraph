
var nodes = new vis.DataSet([
    { id : 1, label: "Node 1" },
    { id: 2, label: "Node 2" },
    { id: 3, label: "Node 3" },
    { id: 4, label: "Node 4" },
    { id: 5, label: "Node 5" }
  ]);

// create an array with edges
var edges = new vis.DataSet([
  { from: 1, to: 3 },
  { from: 1, to: 2 },
  { from: 2, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 4 }
]);

// create a network
var container = document.getElementById("graphCanvas");
var data = {
  nodes: nodes,
  edges: edges
};

function handleDoubleClick(event){
  if(event.nodes.length!=0){
    nodes.remove(event.nodes[0]);
  }else if(event.edges.length!=0){
    edges.remove(event.edges[0]);
  }else{
    nodes.add({x:event.pointer.canvas.x,y:event.pointer.canvas.y})
  }
}

function handleDeselectNode(event){
  var fromId = event.previousSelection.nodes[0].id;
  var toId = event.nodes[0];
  if(event.previousSelection.nodes.length>0 && event.nodes.length>0){
    var existEdge = network.getConnectedEdges(fromId).filter((fromEdge)=>network.getConnectedEdges(toId).includes(fromEdge));
    if(existEdge.length>0){
      edges.remove(existEdge[0]);
    }
    else {
      edges.add({from: fromId, to: toId});
    }
    network.selectNodes([]);
  }
}

var options = {
  autoResize: true,
  height: '100%',
  width: '100%',
  clickToUse: false,
};

var network = new vis.Network(container, data, options);

network.on("doubleClick",handleDoubleClick);
network.on("deselectNode",handleDeselectNode);