(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.erd = {
    attach: function (context, settings) {
      var width = 700;
      var height = 600;

      var erd = joint.shapes.erd;

      var graph = new joint.dia.Graph();

      var paper = new joint.dia.Paper({
        el: document.getElementById('erd-container'),
        width: width,
        height: height,
        gridSize: 1,
        model: graph,
        linkPinning: false,
        linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
      });

      // Create shapes

      var entity = new erd.Entity({
        position: { x: 100, y: 200 },
        attrs: {
          text: {
            fill: '#ffffff',
            text: 'Entity Type',
            'letter-spacing': 0,
            style: { 'text-shadow': '1px 0 1px #333333' }
          },
          '.outer, .inner': {
            fill: '#31d0c6',
            stroke: 'none',
            filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
          }
        }
      });

      var cells = [];

      for (var i in settings.erd.entities) {
        cells.push(entity.clone().translate(0, 200).attr('text/text', settings.erd.entities[i].label));
      }

      graph.addCells(cells);
    }
  };

}(jQuery, Drupal));
