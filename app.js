(function () {
    var application = angular.module("application", []);

    application.controller("applicationCtrl", ["$scope", "$http", applicationCtrl]);

    function applicationCtrl($scope, $http) {
        $scope.data = [];
        $scope.indicator = [];
        $scope.source = [];
        $scope.topic = [];
        $scope.dataForTable = [];
        $scope.dataForMap = [];
        $scope.onlyCountry = [];
        $scope.region = [];
        $scope.incomeLevel = [];
        $scope.aggregate = [];


        $scope.dec = 0;
        $scope.selectedIndicator = null;
        $scope.selectedIndicatorId = null;
        $scope.selectedIndicatorText = null;
        $scope.message;
        $scope.messageIndicator = "Select a Topic or Source to load indicators for it.";
        $scope.messageChart = null;
        $scope.fromDate = 1960;
        $scope.toDate = 2015;

        $scope.min = 10000;
        $scope.max = -10000;
        $scope.year = 2014;

        $scope.selectedCountries = [];

        $scope.baseUrl = "http://api.worldbank.org/countries/all/indicators/";
        $scope.sourceUrl = "http://api.worldbank.org/source?";
        $scope.countryUrl = "http://api.worldbank.org/country?per_page=264&";
        $scope.regionUrl = "http://api.worldbank.org/region?";
        $scope.topicUrl = "http://api.worldbank.org/topic?";
        $scope.incomeLevelUrl = "http://api.worldbank.org/incomelevel?";
        $scope.lendingTypeUrl = "http://api.worldbank.org/lendingtype?";
        $scope.prefix = "format=jsonP&prefix=JSON_CALLBACK&callback=JSON_CALLBACK";

        $scope.arrayChanged = function (id, val) {
            var a = $scope.selectedCountries.indexOf(id);
            if (a === -1 && val === true) {
                $scope.selectedCountries.push(id);
            } else if (a != -1 && val === false) {
                $scope.selectedCountries.splice(a, 1);
            }
        }

        $scope.selectIndicatorId = function (id) {
            $scope.selectedIndicatorId = id;
        }

        $scope.range = function (min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) {
                input.push(i);
            }
            return input;
        };

        $scope.refreshMap = function () {
            d3.select("#container").remove();
            var objec = contains($scope.dataForMap, $scope.year);
            if (objec === null) {
                var ar = [];
                d3.select("#map")
                    .append("div").attr("id", "container");
                map(ar, $scope.selectedIndicator, $scope.min, $scope.max);
            } else {
                d3.select("#map")
                    .append("div").attr("id", "container");
                map(objec.values, $scope.selectedIndicator, $scope.min, $scope.max);
            }
        }

        $scope.table = function () {
            var selectedCountries = $scope.selectedCountries;
            if (selectedCountries == undefined) {
                $scope.message = "Select countries.";
                return;
            } else {
                $scope.message = null;
            }
            var toSend = [];

            for (var j = 0; j < selectedCountries.length; j++) {
                var ob = contains($scope.data, selectedCountries[j]);
                if (ob != null) {
                    toSend.push(ob);
                }
            }
            $scope.dataForTable = toSend;
        };

        $scope.draw = function (num) {
            var selectedCountries = $scope.selectedCountries;
            if (selectedCountries == undefined) {
                $scope.message = "Select countries.";
                return;
            } else {
                $scope.message = null;
            }

            var toSend = [];
            if (selectedCountries.length > 10) {
                $scope.messageChart = "Please note that up-to 10 countries can be displayed on the chart simultaneously.";
            } else {
                $scope.messageChart = null;
            }
            for (var j = 0; j < selectedCountries.length && toSend.length < 10; j++) {
                var ob = contains($scope.data, selectedCountries[j]);
                if (ob != null) {
                    toSend.push(ob);
                }
            }


            d3.select("svg").remove();
            d3.select("#chart")
                .append("svg").style("height", "400px");
            if (num === 1) {
                drawLine(toSend, $scope);
            } else if (num === 2) {

                drawStacked(toSend, $scope);
            } else if (num === 3) {

                drawBar(toSend, $scope);
            }

        };

        $scope.getTopics = function () {
            var url = $scope.topicUrl + $scope.prefix;

            $http.jsonp(url)
                .success(function (result) {
                    for (i = 0; i < result[1].length; i++) {
                        $scope.topic.push({
                            id: result[1][i].id,
                            value: result[1][i].value,
                            sourceNote: result[1][i].sourceNote
                        });
                    }
                })
                .error(function (result) {
                    console.log(result);
                });
        };

        $scope.getCountries = function () {
            var url = $scope.countryUrl + $scope.prefix;

            $http.jsonp(url)
                .success(function (result) {
                    for (i = 0; i < result[1].length; i++) {
                        // Check if element is country and add to onlyCountry array
                        if (result[1][i].region.id != "NA") {
                            var inco = contains($scope.incomeLevel, result[1][i].incomeLevel.id);
                            var regi = contains($scope.region, result[1][i].region.id);
                            if (inco === null) {

                                $scope.incomeLevel.push({
                                    key: result[1][i].incomeLevel.id,
                                    value: result[1][i].incomeLevel.value
                                });
                            }
                            if (regi === null) {
                                $scope.region.push({
                                    key: result[1][i].region.id,
                                    value: result[1][i].region.value
                                });
                            }
                            $scope.onlyCountry.push({
                                id: result[1][i].id,
                                iso2Code: result[1][i].iso2Code,
                                name: result[1][i].name,
                                regionId: result[1][i].region.id,
                                regionValue: result[1][i].region.value,
                                incomeLevelId: result[1][i].incomeLevel.id,
                                incomeLevelValue: result[1][i].incomeLevel.value,
                                lendingTypeId: result[1][i].lendingType.id,
                                lendingTypeValue: result[1][i].lendingType.value

                            });
                        } else if (result[1][i].region.id === "NA") {
                            $scope.aggregate.push({
                                id: result[1][i].id,
                                iso2Code: result[1][i].iso2Code,
                                name: result[1][i].name,
                            });
                        }
                    }
                })
                .error(function (result) {
                    console.log(result);
                });
        };

        $scope.getIndicators = function (topicOrSourceId, topicOrSource) {
            $scope.messageIndicator = null;
            var baseUrl = null;

            if (topicOrSource == 0) {
                baseUrl = "http://api.worldbank.org/topic/";
            } else {
                baseUrl = "http://api.worldbank.org/source/";
            }

            $scope.indicator = [];
            var url = baseUrl + topicOrSourceId + "/indicator?per_page=20000&" + $scope.prefix;

            $http.jsonp(url)
                .success(function (result) {
                    for (i = 0; i < result[1].length; i++) {
                        $scope.indicator.push({
                            id: result[1][i].id,
                            name: result[1][i].name,
                            sourceNote: result[1][i].sourceNote
                        });
                    }
                })
                .error(function (result) {
                    console.log(result);
                });
        };

        $scope.getSources = function () {
            var url = $scope.sourceUrl + $scope.prefix;
            $http.jsonp(url)
                .success(function (result) {
                    for (i = 0; i < result[1].length; i++) {
                        $scope.source.push({
                            id: result[1][i].id,
                            name: result[1][i].name
                        });
                    }
                })
                .error(function (result) {
                    console.log(result);
                });
        };

        $scope.getData = function (fromDate, toDate) {
            $scope.data = [];
            $scope.dataForMap = [];
            d3.select("#container").remove();
            $scope.min = 100000;
            $scope.max = -100000;
            var url = $scope.baseUrl + $scope.selectedIndicatorId + "?per_page=20000&date=" + fromDate + ":" + toDate + "&" + $scope.prefix;
            $http.jsonp(url)
                .success(function (result) {

                    if (result[1] == null) {
                        $scope.message = "There is no data yet for this indicator.";
                        return;
                    }
                    $scope.message = null;
                    var obj = findIndicator($scope.indicator, $scope.selectedIndicatorId);
                    if (obj == null) {
                        return;
                    }
                    $scope.selectedIndicator = obj.name;
                    $scope.selectedIndicatorText = obj.sourceNote;
                    if (result[1][0].indicator.value.indexOf('%') > -1 || result[1][0].indicator.value.indexOf('ercent') > -1) {
                        $scope.dec = 1;
                    } else {
                        $scope.dec = 0;
                    }
                    for (var i = result[1].length - 1; i >= 0; i--) {
                        if (result[1][i].value != null) {
                            // collect data for map
                            var isC = isCountry($scope.onlyCountry, result[1][i].country.id);
                            if (isC) {
                                if (result[1][i].value < $scope.min) {
                                    $scope.min = result[1][i].value;
                                }
                                if (result[1][i].value > $scope.max) {
                                    $scope.max = result[1][i].value;
                                }
                                var obj = contains($scope.dataForMap, result[1][i].date);
                                if (obj === null) {
                                    var arra = [];
                                    arra.push({
                                        code: result[1][i].country.id,
                                        value: result[1][i].value,
                                        name: result[1][i].country.value
                                    });

                                    $scope.dataForMap.push({
                                        key: result[1][i].date,
                                        values: arra
                                    });

                                } else if (obj != null) {
                                    obj.values.push({
                                        code: result[1][i].country.id,
                                        value: result[1][i].value,
                                        name: result[1][i].country.value
                                    });

                                }
                            }
                            // collect data for graph, table
                            var ob = contains($scope.data, result[1][i].country.value);
                            if (ob === null) {
                                var ar = [];
                                var arr = [];
                                arr.push(result[1][i].date);
                                arr.push(result[1][i].value);
                                ar.push(arr);
                                $scope.data.push({
                                    key: result[1][i].country.value,
                                    values: ar
                                });

                            } else {
                                var arr = [];
                                arr.push(result[1][i].date);
                                arr.push(result[1][i].value);
                                ob.values.push(arr);
                            }
                        }
                    }
                    var objec = contains($scope.dataForMap, $scope.year);
                    if (objec === null) {
                        var ar = [];
                        d3.select("#map")
                            .append("div").attr("id", "container");
                        map(ar, $scope.selectedIndicator, $scope.min, $scope.max);
                    } else {
                        d3.select("#map")
                            .append("div").attr("id", "container");
                        map(objec.values, $scope.selectedIndicator, $scope.min, $scope.max);
                    }
                })
                .error(function (result) {
                    console.log(result);
                });
        };
        
        $scope.getCountries();
        $scope.getSources();
        $scope.getTopics();
    }

    function findIndicator(ar, indicatorId) {
        for (var i = 0; i < ar.length; i++) {
            if (ar[i].id === indicatorId) {
                return ar[i];
            }
        }
        return null;
    };

    function isCountry(a, idd) {
        var i = a.length;
        while (i--) {
            if (a[i].iso2Code === idd) {
                return true;
            }
        }
        return false;
    };

    function contains(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i].key === obj) {
                return a[i];
            }
        }
        return null;
    };
    // Line chart
    function drawLine(data, $scope) {
        var num = 1;
        if ($scope.dec == 1) {
            num = 100;
        }
        nv.addGraph(function () {
            var chart = nv.models.lineWithFocusChart()
                .x(function (d) {
                    return d[0];
                })
                .y(function (d) {
                    return d[1] / num;
                })
                .color(d3.scale.category10().range())
                .useInteractiveGuideline(true);
            chart.xAxis
                .tickFormat(function (d) {
                    return d3.time.format('%x')(new Date(Date.parse(d)));
                });
            if ($scope.dec == 1) {
                chart.yAxis.tickFormat(d3.format(',.2%'));
            } else {
                chart.yAxis.tickFormat(d3.format(',.2f'));
            }
            d3.select('#chart svg')
                .datum(data)
                .transition().duration(500)
                .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });
    };

    // Stacked area chart
    function drawStacked(data, $scope) {
        var num = 1;
        if ($scope.dec == 1) {
            num = 100;
        }
        nv.addGraph(function () {
            var chart = nv.models.stackedAreaChart()
                .x(function (d) {
                    return d[0];
                })
                .y(function (d) {
                    return d[1] / num;
                })
                .clipEdge(true)
                .useInteractiveGuideline(true);
            chart.xAxis
                .showMaxMin(false)
                .tickFormat(function (d) {
                    return d3.time.format('%x')(new Date(Date.parse(d)));
                });

            if ($scope.dec == 1) {
                chart.yAxis.tickFormat(d3.format(',.2%'));
            } else {
                chart.yAxis.tickFormat(d3.format(',.2f'));
            }
            d3.select('#chart svg')
                .datum(data)
                .transition().duration(500).call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });
    };
    // Stacked/Grouped Multi-Bar Chart
    function drawBar(data, $scope) {
        var num = 1;
        if ($scope.dec == 1) {
            num = 100;
        }
        nv.addGraph(function () {
            var chart = nv.models.multiBarChart()
                .x(function (d) {
                    return d[0];
                })
                .y(function (d) {
                    return d[1] / num;
                });

            chart.xAxis
                .tickFormat(function (d) {
                    return d3.time.format('%x')(new Date(Date.parse(d)));
                });

            if ($scope.dec == 1) {
                chart.yAxis.tickFormat(d3.format(',.2%'));
            } else {
                chart.yAxis.tickFormat(d3.format(',.2f'));
            }
            d3.select('#chart svg')
                .datum(data)
                .transition().duration(500)
                .call(chart);
            nv.utils.windowResize(chart.update);
            return chart;
        });

    };

    function map(data, indicat, min, max) {

        $(function () {
            // Add lower case codes to the data set for inclusion in the tooltip.pointFormat
            $.each(data, function () {
                if (this.code != undefined) {
                    this.flag = this.code.replace('UK', 'GB').toLowerCase();
                }
            });
            // Initiate the chart
            $('#container').highcharts('Map', {
                legend: {
                    title: {
                        text: indicat,
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                        }
                    }
                },
                title: {
                    text: ''
                },

                mapNavigation: {
                    enabled: true,
                    buttonOptions: {
                        verticalAlign: 'bottom'
                    }
                },

                tooltip: {
                    backgroundColor: 'none',
                    borderWidth: 0,
                    shadow: false,
                    useHTML: true,
                    padding: 0,
                    pointFormat: '<span class="f32"><span class="flag {point.flag}"></span></span>' +
                        ' {point.name}: <b>{point.value}</b>',
                    positioner: function () {
                        return {
                            x: 0,
                            y: 250
                        };
                    }
                },
                colorAxis: {
                    min: min,
                    max: max,
                    type: 'linear'
                },


                series: [{
                    data: data,
                    mapData: Highcharts.maps['custom/world'],
                    joinBy: ['iso-a2', 'code'],
                    name: indicat,
                    states: {
                        hover: {
                            color: '#BADA55'
                        }
                    }
            }]
            });

        });
    };


}());