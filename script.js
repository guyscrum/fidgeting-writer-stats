// Code goes here

var getBinomial = function(N, p) {
  var count = 0;
  for (var i = 0; i < N; i++) {
    if (Math.random() < p) count++;
  }
  return count;
};



// Angular code:
var theApp = angular.module('theApp', []);

theApp.controller('theCtrl', function($scope) {
  $scope.conversions = [{
    convertFrom: 'Tale of Terror',
    convertTo: 'Sense of Deja Vu',
    probability: 0.7,
    conversionCost: 50,
    sellAmount: 250,
    sellActionCost: 1,
  }, {
    convertFrom: 'Sense of Deja Vu',
    convertTo: 'Glimpse of Something Larger',
    probability: 0.7,
    conversionCost: 50,
    sellAmount: 500,
    sellActionCost: 1,
  }, {
    convertFrom: 'Glimpse of Something Larger',
    convertTo: 'Deal with a Devil',
    probability: 0.7,
    conversionCost: 100,
    sellAmount: 1250,
    sellActionCost: 1,
  }, {
    convertFrom: 'Deal with a Devil',
    convertTo: 'Room Number at the Royal Beth',
    probability: 0.6,
    conversionCost: 100,
    sellAmount: 2500,
    sellActionCost: 1,
  }, {
    convertFrom: 'Room Number at the Royal Beth',
    convertTo: 'Last Hope of the Fidgeting Writer',
    probability: 0.55,
    conversionCost: 250,
    sellAmount: 6250,
    sellActionCost: 1,
  }, {
    convertFrom: 'Last Hope of the Fidgeting Writer',
    convertTo: 'Lens of Black Glass',
    probability: 0.55,
    conversionCost: 250,
    sellAmount: 15000,
    sellActionCost: 1,
  }, {
    convertFrom: 'Lens of Black Glass',
    convertTo: 'Coruscating Soul',
    probability: 0.55,
    conversionCost: 250,
    sellAmount: 31250,
    sellActionCost: 0,
  }, ];
  var numConversions = $scope.conversions.length;

  var updateConversions = function() {
    var cumProb = 1.0,
      cumAct = 0;
    cumCost = 0;
    for (var i = 0; i < numConversions; i++) {
      var c = $scope.conversions[i];
      cumAct += cumProb;
      cumCost += cumProb * c.conversionCost;
      cumProb *= c.probability;
      c.cumAct = cumAct;
      c.cumProb = cumProb;
      c.cumCost = cumCost;
      c.expectedProfit = c.sellAmount * cumProb - cumCost;
      c.expectedActionsToSell = cumAct + cumProb * c.sellActionCost;
      c.expectedPPA = c.expectedProfit / c.expectedActionsToSell;
    }
  };

  $scope.$watch('conversions', function() {
    updateConversions();
  }, true);

  $scope.stopItem = $scope.conversions[$scope.conversions.length - 1];

  $scope.numSimTrials = 500;
  $scope.numSimTales = 1000;
  $scope.numBins = 30;

  var runOneTrial = function() {
    var numItems = $scope.numSimTales,
      numActions = 0,
      totalCost = 0;
    for (var i = 0; i < numConversions; i++) {
      var c = $scope.conversions[i];
      numActions += numItems;
      totalCost += numItems * c.conversionCost;
      numItems = getBinomial(numItems, c.probability);
      if (c === $scope.stopItem) {
        break;
      }
    }
    numActions += numItems * $scope.stopItem.sellActionCost;
    var profit = numItems * $scope.stopItem.sellAmount - totalCost;
    return [numActions, profit];
  };

  var binData = function(data, numbins) {
    // First figure out the appropriate spacing
    numbins = numbins || 20;
    var i, ymin = data[0],
      ymax = data[0],
      bins = [];
    for (i = 0; i < data.length; i++) {
      ymin = Math.min(data[i], ymin);
      ymax = Math.max(data[i], ymax);
    }
    var spacing = (ymax - ymin) / (numbins - 0.1);
    ymin = 0.5 * (ymax + ymin - spacing * numbins);
    for (i = 0; i < numbins; i++) {
      bins.push({
        binStart: ymin + i * spacing,
        binEnd: ymin + (i + 1) * spacing,
        count: 0
      });
    }
    for (i = 0; i < data.length; i++) {
      var j = Math.floor((data[i] - ymin) / spacing);
      if (j < numbins) {
        bins[j].count += 1;
      }
    }
    return bins;
  };

  $scope.runSimulation = function() {
    //  alert(getBinomial(700,0.8));
    var actions = [],
      profits = [],
      ppa = [];
    for (var i = 0; i < $scope.numSimTrials; i++) {
      var result = runOneTrial();
      actions.push(result[0]);
      profits.push(result[1] / 100);
      ppa.push(result[1] / result[0]);
    }
    $scope.binnedActions = binData(actions, $scope.numBins);
    $scope.binnedProfits = binData(profits, $scope.numBins);
    $scope.binnedPPA = binData(ppa, $scope.numBins);
    $scope.simText = '(' + $scope.numSimTrials + ' trials, ' +
      $scope.numSimTales + ' Tales of Terror each; stopping conversion at "' +
      $scope.stopItem.convertTo + '")';
  };
});

theApp.directive('aHistogram', function() {
  return {
    scope: {
      data: '=',
      xtitle: '@'
    },
    link: function(scope, element, attribs) {
      var svg = d3.select(element[0]),
        width = 450,
        height = 250,
        margins = {
          top: 20,
          bottom: 50,
          left: 60,
          right: 40
        };
      svg.style({
        width: width + margins.left + margins.right,
        height: height + margins.top + margins.bottom
      });
      var graph = svg.append('g')
        .attr('transform', 'translate(' +
          margins.left + ',' + margins.top + ')');
      var content = graph.append('g');
      graph.append('g').attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')');
      graph.append('g').attr('class', 'y axis');
      graph.append('g').attr('class', 'y2 axis cmf')
        .attr('transform', 'translate(' + width + ',0)');
      var xScale = d3.scale.linear()
        .domain([0, 10]).range([0, width]);
      var yScale = d3.scale.linear()
        .domain([0, 1]).range([height, 0]);
      var yScale2 = d3.scale.linear()
        .domain([0, 1]).range([height, 0]);
      var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
      var yAxis = d3.svg.axis().scale(yScale).orient('left')
        .ticks(10, '%');
      var yAxis2 = d3.svg.axis().scale(yScale2).orient('right')
        .ticks(10, '%');
      svg.append('text')
        .attr('x', -margins.top - height / 2)
        .attr('y', 20)
        .attr('transform', 'rotate(-90)')
        .style('text-anchor', 'middle')
        .text('Frequency');
      var xtext = svg.append('text')
        .attr('x', margins.left + width / 2)
        .attr('y', margins.top + margins.bottom + height - 10)
        .style('text-anchor', 'middle')
        .text(scope.xtitle);


      var updateGraph = function() {
        var data = scope.data;
        var totalCount = 0;
        var maxbin = 0;
        if (data && data.length) {
          cmf = [{
            count: 0,
            x: data[0].binStart
          }];
          for (var i = 0; i < data.length; i++) {
            maxbin = Math.max(maxbin, data[i].count);
            totalCount += data[i].count;
            cmf.push({
              count: totalCount,
              x: data[i].binEnd
            });
          }
          var xmin = data[0].binStart,
            xmax = data[data.length - 1].binEnd,
            spacing = data[0].binEnd - xmin;
          xScale.domain([xmin - spacing / 3, xmax + spacing / 3]);
          yScale.domain([0, maxbin / totalCount]);

          var bar = content.selectAll(".bar").data(data);
          bar.enter().append('rect').attr('class', 'bar');
          bar.attr('x', function(d) {
            return xScale(d.binStart);
          }).attr('width', function(d) {
            return xScale(d.binEnd) - xScale(d.binStart);
          }).attr('y', function(d) {
            return yScale(d.count / totalCount);
          }).attr('height', function(d) {
            return yScale(0) - yScale(d.count / totalCount);
          });

          var pathgen = d3.svg.line()
            .interpolate('linear')
            .x(function(d) {
              return xScale(d.x);
            }).y(function(d) {
              return yScale2(d.count / totalCount);
            });
          var path = content.selectAll('path.cmf').data([cmf]);
          path.enter().append('path').attr('class', 'cmf');
          path.attr('d', pathgen);

          var circs = content.selectAll('circle.cmf').data(cmf);
          circs.enter().append('circle')
            .attr('class', 'cmf').attr('r', 2);
          circs.attr('cx', function(d) {
            return xScale(d.x);
          }).attr('cy', function(d) {
            return yScale2(d.count / totalCount);
          });
        } else {
          content.selectAll('.bar').remove();
          content.selectAll('path.cmf').remove();
          content.selectAll('circle.cmf').remove();
        }
        graph.select('.x.axis').call(xAxis);
        graph.select('.y.axis').call(yAxis);
        graph.select('.y2.axis').call(yAxis2);
        xtext.text(scope.xtitle);
      };

      scope.$watch('data', updateGraph);

    }
  };
});
