var numWidgets = 1;
var maxValue = 0;

var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  width = 600 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// colors from http://colorbrewer2.org/?type=qualitative&scheme=Pastel1&n=7
var color = d3.scale.ordinal().range(['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd']);

var treemap = d3.layout.treemap()
  .size([width, height])
  .round(true)
  .value(getValue);

var div = d3.select(".treemap")
  .style("position", "relative")
  .style("width", (width + margin.left + margin.right) + "px")
  .style("height", (height + margin.top + margin.bottom) + "px")
  .style("left", margin.left + "px")
  .style("top", margin.top + "px");

var root = getJson();
updateTreemap(treemap.nodes(root));

function updateTreemap(data) {
  d3.select(".score")
    .text(numWidgets);

  var node = div.selectAll(".node")
    .data(data, getKey);

  node.exit().remove();

  var createdNodes = node.enter()
    .append("div")
    .attr("class", "node")
    .on('click', clickNode);

  node.classed('leaf', isLeaf)
    .classed('started', isStarted)
    .classed('completed', isCompleted)
    .classed('unfinished', isUnfinished)
    .classed('failure', isFailure);

  createdNodes
    .append('div')
    .attr("class", "node-container")
    .append('span')
    .attr("class", "node-label");

  createdNodes.append('div')
    .attr("class", "node-progress");

  node.selectAll('.leaf .node-progress')
    .style("background", function(d) { return color(d.name); })
    .style("width", function(d) { return 100 - 100 * ((d.successes || 0) / d.required) + '%'; });

  node.selectAll('.unfinished .node-label')
    .text(function(d) { return "+" + d.reward + " (" + Math.floor(100 * getOdds(d)) + "%)"; });
  
  node.selectAll('.completed .node-label')
    .text(function(d) { return "+" + d.reward; });
  
  node.transition()
    .duration(400)
    .call(position);
}

function clickNode(d) {
  var spawn = hire(d);

  updateTreemap(treemap.nodes(root));
}

function addQuest(d, parent) {
  if (!parent) {
    parent = root;
  }
  
  var grandparent = parent.parent ? parent.parent : parent;

  d.name = d.name || (parent.name + '+');

  grandparent.children.push(d);
  if (maxValue < getValue(d)) {
    maxValue = getValue(d);
  }
}

function isLeaf(d) {
  return !d.children;
}

function isStarted(d) {
  return !!d.successes; 
}

function isUnfinished(d) {
  return (d.successes || 0) < d.required; 
}

function isCompleted(d) {
  return d.successes >= d.required; 
}

function isFailure(d) {
  return d.result === 'Failed';
}

function getKey(d) {
  return d.name;
}

function getValue(d) {
  return d.required * d.difficulty;
}

function getOdds(d) {
  return numWidgets / d.difficulty;
}

function position() {
  this.style("left", function(d) {
      return d.x + "px";
    })
    .style("top", function(d) {
      return d.y + "px";
    })
    .style("width", function(d) {
      return Math.max(0, d.dx - 1) + "px";
    })
    .style("height", function(d) {
      return Math.max(0, d.dy - 1) + "px";
    });
}

function hire(widgeteer) {
  widgeteer.successes = widgeteer.successes || 0;
  widgeteer.tries = widgeteer.tries || 0;

  if (widgeteer.successes >= widgeteer.required) {
    return;
  }

  var success = 0;
  widgeteer.tries++;

  if (widgeteer.difficulty <= numWidgets) {
    success = Math.floor(numWidgets / widgeteer.difficulty);
  } else {
    success = 0 + (Math.random() < numWidgets / widgeteer.difficulty);
  }

  if (success) {
    widgeteer.result = "Success";
    widgeteer.successes += success;
    widgeteer.tries++;

    if (widgeteer.successes >= widgeteer.required) {
      numWidgets += widgeteer.reward;
      widgeteer.result = "Completed";

      var spawn = generateQuest(widgeteer.reward + 1, numWidgets);
      addQuest(spawn, widgeteer);
      return spawn;
    }
  } else {
    widgeteer.result = "Failed";
  }
}

function generateQuest(reward, power) {
  var clicks = Math.random() * 10 + 10;
  var rate = Math.random() * 0.25 + 0.25;
  var difficulty = Math.ceil(power / rate);
  var required = Math.ceil(clicks * rate);

  return {
    "required": required,
    "difficulty": difficulty,
    "reward": reward
  }
}

function getJson() {
  var names = ['novice', 'apprentice', 'expert', 'master', 'wisened', 'artisan', 'enlightened'];
  var json = {
    name: 'base',
    children: []
  };

  for (var i = 0; i < names.length; i++) {
    var spawn = {
      "name": names[i],
      "required": 10,
      "difficulty": Math.pow(2, i),
      "reward": i + 1
    };

    addQuest(spawn, json);
  }

  return json;
}