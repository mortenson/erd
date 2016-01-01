(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.erd = {
    attach: function (context, settings) {
      // Set up our initial SVG and JointJS settings.

      var erd = joint.shapes.erd;

      var graph = new joint.dia.Graph();

      new joint.dia.Paper({
        el: document.getElementById('erd-container'),
        width: '100%',
        height: 500,
        gridSize: 1,
        model: graph,
        linkPinning: false,
        linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
      });

      // Create default shapes.

      var entity_type = new erd.Entity({
        markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text class="label"/></g>',
        position: { x: 0, y: 0 },
        attrs: {
          '.label': {
            fill: '#ffffff',
            text: '',
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

      // For each entity type and bundle, create an add/remove button.
      var entity_list = $('<ul></ul>');
      entity_list.addClass('erd-list erd-type-list');
      for (var i in settings.erd.entities) {
        var entity_item = $('<li></li>');
        entity_item.data('entity-type-id', settings.erd.entities[i].id);
        entity_item.addClass('erd-item erd-type-item');
        entity_item.html('<span class="label">' + settings.erd.entities[i].label + '</span><div class="actions"><a class="expand"></a><a class="addremove"></a></div>');

        var bundle_list = $('<ul></ul>');
        bundle_list.addClass('erd-list erd-bundle-list');
        for (var j in settings.erd.entities[i].bundles) {
          var bundle_item = $('<li></li>');
          bundle_item.data('entity-bundle-name', settings.erd.entities[i].bundles[j].name);
          bundle_item.addClass('erd-item erd-bundle-item');
          bundle_item.html('<span class="label">' + settings.erd.entities[i].bundles[j].label + '</span><div class="actions"><a class="addremove"></a></div>');
          bundle_list.append(bundle_item);
        }

        if (bundle_list.length > 0) {
          entity_item.append(bundle_list);
        }

        entity_list.append(entity_item);
      }

      $('#erd-container').append(entity_list);

      // Set up events for adding types/bundles to the SVG.

      $('.erd-type-item .expand').click(function() {
        $(this).closest('.erd-type-item').toggleClass('expanded');
      });

      $('.erd-type-item .addremove').click(function() {
        var $element = $(this).closest('.erd-type-item');
        var id = $element.data('entity-type-id');
        if ($element.hasClass('added')) {
          graph.get('cells').findWhere({ identifier: id }).remove();
        }
        else {
          var cell = entity_type.clone().translate(0, 200).attr('.label/text', settings.erd.entities[id].label);
          cell.set({identifier: id}, { silent: true });
          graph.addCell(cell);
        }
        $element.toggleClass('added');
      });
    }
  };

}(jQuery, Drupal));
