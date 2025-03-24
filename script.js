// 各パラメータ
var nodesSize = 0; 
var maxNodeId = 0;
var nodes = new vis.DataSet([]);
var edges = new vis.DataSet([]);
var maxGPSIdses = [];
var isFindMaxGPS = false;
var nowMaxGPSIdsesIndex = 0;
var previousClickTime = performance.now();
var physicsCheckBoxElement = document.getElementById("physicsCheckBox");


// 初期化関数
function init(){
  maxGPSIdses = [];
  isFindMaxGPS = false;
  nowMaxGPSIdsesIndex = 0;
}

// グラフ生成関数
function makeGraph(){
  console.log("新グラフ")
  nodesSize = Math.floor(Math.random()*10)+3; 
  maxNodeId = nodesSize-1;
  nodes.clear();
  edges.clear();
  init()

  physicsCheckBoxElement.checked = true;
  options.physics.enabled = true;
  network.setOptions(options);

  for(var i=0;i<nodesSize;i++){
    nodes.add({
      id: i,
      label: ""+i,
      color:{
        background:"#dbfffe",
        border:"#000000"
      }
    });
  }
  for(var i=1;i<nodesSize;i++){ //0 を初期グラフとし, 1以降を追加していく
    if(Math.random()>0.3){ // 0<= Math.random <1
      edges.add({from:i, to:Math.floor(Math.random()*i)});
    }else{
      var d=2+Math.floor(Math.random()*(i-2));
      var indexList=[];
      for(var j=0;j<i;j++){indexList.push(j);}
      for(var j=0;j<i-d;j++){
        var randInd = Math.floor(Math.random()*indexList.length);
        indexList.splice(randInd,1);
      }
      for(var j=0;j<d;j++){
        edges.add({from: i, to:indexList[j]});
      }
    }
  }
}

// ダブルクリック処理
function handleDoubleClick(event){
  if(event.nodes.length!=0){
    nodes.remove(event.nodes[0]);
    maxNodeId = Math.max(...nodes.map(item=>item.id));
    nodesSize--;
  }else{
    var addNodeId = Math.max(...nodes.map(item=>item.id))+1;
    nodes.add({
      id:addNodeId, 
      label:addNodeId+"", 
      x:event.pointer.canvas.x,
      y:event.pointer.canvas.y,
      color:{
        background:"#dbfffe",
        border:"#000000"
      }
    });
    nodesSize++;
  }
  init();
}

// シングルクリック処理
function handleDeselectNode(event){
  if(event.previousSelection.nodes.length>0 && event.nodes.length>0){
    var fromId = event.previousSelection.nodes[0].id;
    if(!nodes.getIds().includes(fromId)) return;
    var toId = event.nodes[0];
    var existEdge = network.getConnectedEdges(fromId).filter((fromEdge)=>network.getConnectedEdges(toId).includes(fromEdge));
    if(existEdge.length>0){
      edges.remove(existEdge[0]);
    }
    else {
      edges.add({from: fromId, to: toId});
    }
    network.selectNodes([]);
  }
  init();
}

// ドラッグ処理
function handleDragEnd(){
  network.unselectAll();
}

// グラフオプション設定
var options = {
  autoResize: true,
  height: '100%',
  width: '100%',
  clickToUse: false,
  edges:{
    smooth:false,
    // length:200,
    color: "#000000"
  },
  physics:{
    enabled:true
  }
};

// グラフ生成
var container = document.getElementById("graphCanvas");
var data = {
  nodes: nodes,
  edges: edges
};
var network = new vis.Network(container, data, options);

// physicsチェックボックス
function changePhysicsCheckBox(){
  options.physics.enabled = !options.physics.enabled;
  network.setOptions(options);
}
physicsCheckBoxElement.addEventListener("change",changePhysicsCheckBox);

// イベント設定
network.on("doubleClick",handleDoubleClick);
network.on("deselectNode",handleDeselectNode);
network.on("dragEnd",handleDragEnd);

// 頂点部分集合(サイズn)生成
function getSubNodeIdses(n){
  var resultNodeIdses = [];
  var nodeIds = nodes.getIds();
  function makeSubNodeIds(endIndex, nowIndex, nowSize, subNodeIds){
    subNodeIds.push(nodeIds[nowIndex]);
    endIndex = nowIndex++;
    if(subNodeIds.length==n){
      resultNodeIdses.push(subNodeIds);
      return;
    }
    for(var i=endIndex+1;i<nodesSize-(n-subNodeIds.length)+1;i++){
      makeSubNodeIds(endIndex, i,subNodeIds.length, subNodeIds.concat());
    }
  }
  for(var i=0;i<nodesSize-n+1;i++){
    makeSubNodeIds(i,i,0,[].concat());
  }
  return resultNodeIdses;
}

function isGPS(subNodeIds){
  var nodeIds = nodes.getIds();
  for(var j=0;j<subNodeIds.length;j++){
    // 頂点jからbfs開始
    var minPathNodes = new Object(); // minPathNodes[j]: jからkへの最短経路内の頂点全部
    for(var k=0;k<nodesSize;k++){minPathNodes[nodeIds[k]]=[];}
    minPathNodes[subNodeIds[j]]=[subNodeIds[j]];
    var dist = new Object(); // dist[k]: jからkへの最短経路長
    for(var k=0;k<nodesSize;k++){dist[nodeIds[k]]=0;} // dist初期化
    var visited = []; // 訪問済み頂点集合初期化
    var queue = [subNodeIds[j]]; // キュー初期化
    while(queue.length>0){ // キューが空になるまで
      var nowNodeId = queue.shift(); // 訪問頂点
      visited.push(nowNodeId); // 訪問した頂点を訪問済みにする
      var neightborIds = network.getConnectedNodes(nowNodeId); // 隣接頂点集合を取得
      for(var k=0;k<neightborIds.length;k++){ // 各隣接頂点に対して
        if((!visited.includes(neightborIds[k]))&&(!queue.includes(neightborIds[k]))){ // 隣接頂点が未訪問ならば
          dist[neightborIds[k]] = dist[nowNodeId]+1;
          queue.push(neightborIds[k]); // 隣接頂点をキューに追加
        }
        if(dist[neightborIds[k]]==dist[nowNodeId]+1){
          minPathNodes[neightborIds[k]] = [...(new Set([neightborIds[k],...minPathNodes[neightborIds[k]],...minPathNodes[nowNodeId]]))];
        }
      }
    }
    // GPSチェック
    for(var k=0;k<subNodeIds.length;k++){
      if(minPathNodes[subNodeIds[k]].filter((mPk)=>subNodeIds.includes(mPk)).length>2){
        return false;
      }
    }
  }
  return true;
}

// コピー関数
function arrayDeepCopy(arr){
  var cloneArr = [];
  arr.forEach((item)=>{
    Array.isArray(item) ? cloneArr.push(arrayDeepCopy(item)) : cloneArr.push(item);
  });
  return cloneArr;
}

// 色塗り関数
function paintSubNodes(subNodeIds){
  var nodeIds = nodes.getIds();
  for(var i=0;i<nodesSize;i++){
    nodes.update({
      ...nodes.get(nodeIds[i]),
      color:{
        border:"#000000",
        background: (subNodeIds.includes(nodeIds[i]) ? "#f5a4a5" : "#dbfffe")
      }  
    })
  }
}

// 最大GPS全探索
function searchMaxGPS(){
  // 各部分集合に対して
  for(var n=nodesSize;n>0;n--){
    var subNodeIdses = getSubNodeIdses(n); // サイズnの部分集合の集合
    for(var i=0;i<subNodeIdses.length;i++){ // 部分集合subNodesに対して
      var subNodeIds = subNodeIdses[i].concat();
      if(isGPS(subNodeIds)){
        if(!isFindMaxGPS) isFindMaxGPS = true;
        maxGPSIdses.push(arrayDeepCopy(subNodeIds));
        paintSubNodes(subNodeIds);
        // return;
      } 
    }
    if(isFindMaxGPS) return;
  }
}


// 最大GPS色塗り関数
function paintMaxGPS(){
  if(maxGPSIdses.length==0){
    searchMaxGPS();
  }
  paintSubNodes(maxGPSIdses[nowMaxGPSIdsesIndex]);
  nowMaxGPSIdsesIndex = (nowMaxGPSIdsesIndex+1)%maxGPSIdses.length;
}



console.log("開始！");
makeGraph()