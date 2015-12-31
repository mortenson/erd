(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.erd = {
    attach: function (context, settings) {
      // Set up our initial SVG and JointJS settings.

      var erd = joint.shapes.erd;

      var graph = new joint.dia.Graph();

      var paper = new joint.dia.Paper({
        el: document.getElementById('erd-container'),
        width: '100%',
        height: '100%',
        gridSize: 1,
        model: graph,
        linkPinning: false,
        linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
      });

      // Create default shapes.

      var entity_type = new erd.Entity({
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

      //var cells = [];
      //cells.push(entity_type.clone().translate(0, 200).attr('text/text', settings.erd.entities[0].label));
      //graph.addCells(cells);

      // For each entity type and bundle, create an add/remove button.
      var entity_list = $('<ul></ul>');
      entity_list.addClass('erd-list erd-type-list');
      for (var i in settings.erd.entities) {
        var entity_item = $('<li></li>');
        entity_item.data('entity-type-id', settings.erd.entities[i].id);
        entity_item.addClass('erd-item erd-type-item');
        entity_item.html('<a class="expand">^</a><span class="label">' + settings.erd.entities[i].label + '</span>');

        var bundle_list = $('<ul></ul>');
        bundle_list.addClass('erd-list erd-bundle-list');
        for (var j in settings.erd.entities[i].bundles) {
          var bundle_item = $('<li></li>');
          bundle_item.data('entity-bundle-name', settings.erd.entities[i].bundles[j].name);
          bundle_item.addClass('erd-item erd-bundle-item');
          bundle_item.html(settings.erd.entities[i].bundles[j].label);
          bundle_list.append(bundle_item);
        }

        if (bundle_list.length > 0) {
          entity_item.append(bundle_list);
        }

        entity_list.append(entity_item);
      }

      $('#erd-container').append(entity_list);

      // Set up events for adding types to the SVG.

      $('.erd-type-item').click(function() {
        $(this).find('.erd-bundle-list').toggle();
      });
    }
  };

}(jQuery, Drupal));
