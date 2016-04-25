/*
 *  TreeDiagram - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */


TreeDiagram = function (_parentElement, _data, _salesNumbers) {
    this.duration = 750;
    this.parentElement = d3.select(_parentElement);
    this.salesNumbers = _salesNumbers;
    this.data = _data;
    this.initVis(this.data);
    this.i = 0;
};


TreeDiagram.prototype.initVis = function () {

    var margin = {
        top: 40,
        right: 60,
        bottom: 60,
        left: 200
    };
    var width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
    var vis = this;
    vis.tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(
        function (d) {
            var url = './img/Cs_171_EV_pics/' + d.id + '.jpg';
            return (
                "<img class='tooltip-img' src=" + url + ">" +
                '<p>' + d.model + '</p>' +
                '<p>' + d.model_year + '</p>' +
                '<p>$ ' + d.price + '</p>')
        });





    vis.data['x0'] = height / 2;
    vis.data['y0'] = 0;
    vis.tree = d3.layout.tree()
        .size([height, width]);
    vis.diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });
    vis.chart = this.parentElement.append('svg')
        .attr("class", "vis")
        .attr("id", "modelTreeSVG")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom).append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    vis.chart.call(vis.tip);
    vis.collapse(vis.data, vis);
    vis.updateVis(vis.data);
};

TreeDiagram.prototype.updateVis = function (source) {
    var vis = this;
    // Compute the new tree layout.
    vis.nodes = vis.tree.nodes(vis.data);
    vis.links = vis.tree.links(vis.nodes);
    // Normalize for fixed-depth.
    vis.nodes.forEach(function (d) {
        d.y = d.depth * 180;
    });
    // Update the nodes…
    var node = vis.chart.selectAll("g.node")
        .data(vis.nodes, function (d) {
            return d.nid || (d.nid = ++vis.i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", function (d) {
            vis.click(d, vis)
        })
        .on("mouseover", function (d, index) {
            if (d.id) {
                vis.tip.show(d);
            }
        })
        .on("mouseout", function (d, index) {
            if (d.id) {
                vis.tip.hide(d);
            }
        });

    nodeEnter.append("circle")
        .attr("r", 1e-6)

    .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
    });

    nodeEnter.append("text")
        .attr("x", function (d) {
            return d.children || d._children ? (-10 - d.radius) : (10 + d.radius);
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
            return d.key ? d.key : (d.model + " - " + d.model_year);
        })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(vis.duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("circle")
        .attr("r", function (d) {
            return d.radius
        })
        .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    nodeUpdate.select("text")
        .style("fill-opacity", 1)
        .style("fill", "white");

    ;

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(vis.duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = vis.chart.selectAll("path.link")
        .data(vis.links, function (d) {
            return d.target.nid;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr('id', function (d) {
            return d.key
        })
        .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return vis.diagonal({
                source: o,
                target: o
            });
        });

    // Transition links to their new position.
    link.transition()
        .duration(vis.duration)
        .attr("d", vis.diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(vis.duration)
        .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return vis.diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    // Stash the old positions for transition.
    vis.nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
};


TreeDiagram.prototype.openToModel = function (model) {
    vis = this;
    var car;

    function findModel(d, model) {
        if (d.model) {
            if (d.model == model) {
                console.log("found:" + d.model);
                car = d;
            }
        } else {
            d._children.forEach(function (e) {
                return findModel(e, model)
            })
        }
    };
    vis.collapse(vis.data, vis);
    findModel(vis.data, model);
    vis.data.children = vis.data._children;
    vis.data._children = null;
    vis.data.children.forEach(function (d) {
        if (d.key == car.fuel) {
            d.children = d._children;
            d._children = null;
            d.children.forEach(function (e) {
                if (e.key == car.manufacturer) {
                    e.children = e._children;
                    e._children = null;
                }
            })
        }
    });
    vis.updateVis(vis.data);
};


TreeDiagram.prototype.collapse = function (d, vis) {
    if (d.children) {
        d._children = d.children;
        console.log(d.key);
        d._children.forEach(function (e) {
            vis.collapse(e, vis)
        });
        d.children = null;
    }
};

TreeDiagram.prototype.click = function (d, vis) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    vis.updateVis(d);
}