(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.erd = {
    attach: function (context, settings) {
      $('.erd-container').once('erd-init').each(erdInit, [settings]);
    }
  };

  $.widget('custom.erdautocomplete', $.ui.autocomplete, {
    _create: function () {
      this._super();
      this.widget().menu('option', 'items', '> :not(.erd-autocomplete-category)');
    },
    _renderMenu: function (ul, items) {
      var that = this,
        current_category = '';
      $.each( items, function (index, item) {
        var li;
        if (item.data.type_label != current_category) {
          ul.append("<li class='erd-autocomplete-category'>" + item.data.type_label + 's</li>');
          current_category = item.data.type_label;
        }
        li = that._renderItemData(ul, item);
        if (item.data.type_label) {
          li.attr('aria-label', item.data.type_label + 's : ' + item.data.label );
        }
      });
    }
  });

  function erdInit (settings) {
    var graph = createGraph(this);

    var entity_bundle = getDefaultJointEntity();

    var entity_type = entity_bundle.clone();
    entity_type.attr('.outer, .inner, .attribute-background/fill', '#C46A2D');
    entity_type.attr('.outer, .inner, .attribute-background/stroke', '#C46A2D');

    initAutocomplete();

    $('.erd-label').click(function () {
      addLabel();
    });

    $(this).on('click', '.remove-entity', function () {
      var model_id = $(this).closest('[model-id]').attr('model-id');
      graph.get('cells').get(model_id).remove();
    });

    function initAutocomplete () {
      var source_types = [];
      var source_bundles = [];

      for (var i in settings.erd.entities) {
        source_types.push({
          value: settings.erd.entities[i].label,
          data: settings.erd.entities[i]
        });
        for (var j in settings.erd.entities[i].bundles) {
          source_bundles.push({
            value: settings.erd.entities[i].bundles[j].label,
            data: settings.erd.entities[i].bundles[j]
          });
        }
      }

      var source = $.merge(source_types, source_bundles);

      $('.erd-search input').erdautocomplete({
        source: source,
        select: function (suggestion, ui) {
          $('.erd-search input').attr('value', '');
          if (ui.item.data.type == 'type') {
            addType(ui.item.data);
          }
          else {
            addBundle(ui.item.data);
          }
        }
      });
    }

    function createGraph (element) {
      var graph = new joint.dia.Graph();

      var $paper_el = $(element);

      var paper = new joint.dia.Paper({
        el: $paper_el,
        width: '100%',
        height: 650,
        gridSize: 1,
        model: graph,
        linkPinning: false,
        linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
      });

      var panAndZoom = svgPanZoom($paper_el[0].childNodes[0],
        {
          viewportSelector: $paper_el[0].childNodes[0].childNodes[0],
          fit: false,
          zoomScaleSensitivity: 0.1,
          mouseWheelZoomEnabled: false,
          panEnabled: false
        });

      paper.on('blank:pointerdown', function (evt, x, y) {
        panAndZoom.enablePan();
      });

      paper.on('cell:pointerup blank:pointerup', function(cellView, event) {
        panAndZoom.disablePan();
      });

      $('.erd-zoom').click(function () {
        panAndZoom.zoomIn();
      });

      $('.erd-unzoom').click(function () {
        panAndZoom.zoomOut();
      });

      return graph;
    }

    function getDefaultJointEntity () {
      return new joint.shapes.erd.Entity({
        markup:
        '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/><text class="label"/></g>' +
        '<a class="remove-entity"><svg fill="#F7F7F7" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"> <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/> <path d="M0 0h24v24H0z" fill="none"/> </svg></a>',
        attrs: {
          text: {
            text: '',
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
    }

    function addLabel (text) {
      var cell = entity_type.clone().translate(0, 0).attr('.label/text', text);
      graph.addCell(cell);
    }

    function addType (type) {
      var cell = entity_type.clone().translate(0, 0).attr('.label/text', type.label);
      cell.set({identifier: 'type:' + type.id}, { silent: true });
      graph.addCell(cell);

      // Refresh all links on screen.
      refreshLinks();
    }

    function addBundle (bundle) {
      var cell = entity_bundle.clone().translate(0, 0).attr('.label/text', bundle.label);
      cell.set({identifier: 'bundle:' + bundle.id}, { silent: true });
      var markup = cell.get('markup');

      // Add elements to our markup.
      if (bundle.fields) {
        var field, text_class, background_class, background_y, text_y;
        var i = 0;
        for (var field_name in bundle.fields) {
          field = bundle.fields[field_name];
          text_class = 'attribute-' + field_name;
          background_class = 'attribute-background-' + field_name;
          background_y = cell.attr('.attribute-background/ref-y') + (i * 20);
          text_y = cell.attr('.attribute/ref-y') + (i * 20);

          markup += '<polygon class="attribute-background ' + background_class + '"/>';
          markup += '<text class="attribute ' + text_class + '"/>';

          cell.attr('.' + text_class + '/text', field.label);
          cell.attr('.' + text_class + '/ref-y', text_y);
          cell.attr('.' + background_class + '/ref-y', background_y);

          ++i;
        }

        cell.set({markup: markup});

        graph.addCell(cell);

      }

      // Refresh all links on screen.
      refreshLinks();
    }

    function createLink (source, target, label) {
      var link = new joint.shapes.erd.Line({
        source: source,
        target: target,
        attrs: {
          '.marker-target': { fill: '#000000', stroke: '#000000', d: 'M 10 0 L 0 5 L 10 10 z' }
        }
      });

      link.addTo(graph).set('labels', [{
        position: 0.5,
        attrs: {
          text: {text: label, fill: '#f6f6f6', 'font-family': 'sans-serif', 'font-size': 10, style: { 'text-shadow': '1px 0 1px #333333' }},
          rect: { stroke: '#618eda', 'stroke-width': 20, rx: 5, ry: 5 } }
      }]);
    }

    // Builds and refreshs links for all on-screen elements.
    function refreshLinks () {
      for (var i in drupalSettings.erd.links) {
        var link = drupalSettings.erd.links[i];
        var from = graph.get('cells').findWhere({ identifier: link.from });
        // This may not be on-screen.
        if (from) {
          for (var j in link.targets) {
            var to = graph.get('cells').findWhere({ identifier: link.targets[j] });
            if (to && from !== to) {
              createLink({id: from.id, selector: link.from_selector}, {id: to.id}, link.label);
            }
          }
        }
      }
    }
  }

}(jQuery, Drupal));
