(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.erd = {
    attach: function (context, settings) {
      // Set up our initial SVG and JointJS settings.

      var erd = joint.shapes.erd;

      var graph = new joint.dia.Graph();

      var paper_el = $('#erd-container');

      var paper = new joint.dia.Paper({
        el: paper_el,
        width: '100%',
        height: 500,
        gridSize: 1,
        model: graph,
        linkPinning: false,
        linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
      });

      var panAndZoom = svgPanZoom(paper_el[0].childNodes[0],
        {
          viewportSelector: paper_el[0].childNodes[0].childNodes[0],
          fit: false,
          zoomScaleSensitivity: 0.1,
          controlIconsEnabled: true,
          mouseWheelZoomEnabled: false,
          panEnabled: false
        });

      paper.on('blank:pointerdown', function (evt, x, y) {
        panAndZoom.enablePan();
      });

      paper.on('cell:pointerup blank:pointerup', function(cellView, event) {
        panAndZoom.disablePan();
      });

      // Create default shapes.

      var entity_bundle = new erd.Entity({
        markup:
          '<g class="rotatable">' +
          '  <g class="scalable">' +
          '    <polygon class="outer"/>' +
          '    <polygon class="inner"/>' +
          '  </g>' +
          '  <text class="label"/>' +
          '</g>',
        position: { x: 0, y: 0 },
        attrs: {
          text: {
            fill: '#ffffff',
            'letter-spacing': 0,
            style: { 'text-shadow': '1px 0 1px #333333' }
          },
          '.label': {
            text: ''
          },
          '.outer, .inner, .attribute-background': {
            fill: '#2AA8A0', stroke: '#2AA8A0', 'stroke-width': 2,
            points: '100,0 100,60 0,60 0,0',
            filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
          },
          '.attribute': {
            text: '',
            'font-size': 12,
            ref: '.outer', 'ref-x': .5, 'ref-y': 65,
            'x-alignment': 'middle', 'y-alignment': 'middle'
          },
          '.attribute-background': {
            fill: '#31d0c6', stroke: '#289E97',
            points: '150,0 150,20 0,20 0,0',
            ref: '.outer', 'ref-x': 0, 'ref-y': 60
          }
        }
      });

      var entity_type = entity_bundle.clone();
      entity_type.attr('.outer, .inner, .attribute-background/fill', '#C46A2D')
      entity_type.attr('.outer, .inner, .attribute-background/stroke', '#C46A2D');

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
          bundle_item.data('entity-bundle-id', settings.erd.entities[i].bundles[j].id);
          bundle_item.addClass('erd-item erd-bundle-item');
          bundle_item.html('<span class="label">' + settings.erd.entities[i].bundles[j].label + '</span><div class="actions"><a class="addremove"></a></div>');
          bundle_list.append(bundle_item);
        }

        if (bundle_list.length > 0) {
          entity_item.append(bundle_list);
        }

        entity_list.append(entity_item);
      }

      paper_el.append(entity_list);

      // Set up events for adding types/bundles to the SVG.

      $('.erd-type-item .expand').click(function() {
        $(this).closest('.erd-type-item').toggleClass('expanded');
      });

      $('.erd-type-item > .actions > .addremove').click(function() {
        var $element = $(this).closest('.erd-type-item');
        var type_id = $element.data('entity-type-id');
        if ($element.hasClass('added')) {
          graph.get('cells').findWhere({ identifier: type_id }).remove();
        }
        else {
          var cell = entity_type.clone().translate(0, 200).attr('.label/text', settings.erd.entities[type_id].label);
          cell.set({identifier: type_id}, { silent: true });
          graph.addCell(cell);
        }
        $element.toggleClass('added');
      });

      $('.erd-bundle-item > .actions > .addremove').click(function() {
        var $element = $(this).closest('.erd-bundle-item');
        var type_id = $element.closest('.erd-type-item').data('entity-type-id');
        var bundle_id = $element.data('entity-bundle-id');
        if ($element.hasClass('added')) {
          graph.get('cells').findWhere({ identifier: bundle_id }).remove();
        }
        else {
          var bundle = settings.erd.entities[type_id].bundles[bundle_id];
          var cell = entity_bundle.clone().translate(0, 200).attr('.label/text', bundle.label);
          cell.set({identifier: bundle_id}, { silent: true });
          var markup = cell.get('markup');

          var text = '';
          var polygons = '';
          // Assemble replacement elements.
          if (bundle.fields) {
            var field, text_class, background_class, background_y, text_y;
            var i = 0;
            for (var field_name in bundle.fields) {
              field = bundle.fields[field_name];
              text_class = 'attribute-' + field_name;
              background_class = 'attribute-background' + field_name;
              background_y = cell.attr('.attribute-background/ref-y') + (i * 20);
              text_y = cell.attr('.attribute/ref-y') + (i * 20);

              markup += '<polygon class="attribute-background ' + background_class + '"/>';
              markup += '<text class="attribute ' + text_class + '"/>';

              cell.attr('.' + text_class + '/text', field.label);
              cell.attr('.' + text_class + '/ref-y', text_y);
              cell.attr('.' + background_class + '/ref-y', background_y);

              ++i;
            }
          }

          cell.set({markup: markup});

          graph.addCell(cell);
        }
        $element.toggleClass('added');
      });
    }
  };

}(jQuery, Drupal));
