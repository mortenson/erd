<?php

/**
 * @file
 * Contains \Drupal\erd\Controller\EntityRelationshipDiagramController.
 */

namespace Drupal\erd\Controller;

use Drupal\Core\Config\Entity\ConfigEntityTypeInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;
use Drupal\Core\Entity\FieldableEntityInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Contains the primary entity relationship diagram for this module.
 */
class EntityRelationshipDiagramController extends ControllerBase {

  /**
   * @var \Drupal\Core\Entity\EntityFieldManagerInterface
   */
  protected $entityFieldManager;

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * @var \Drupal\Core\Entity\EntityTypeBundleInfoInterface
   */
  protected $entityTypeBundleInfo;

  /**
   * Constructs a new EntityRelationshipDiagram.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   * @param \Drupal\Core\Entity\EntityFieldManagerInterface $entity_field_manager
   * @param \Drupal\Core\Entity\EntityTypeBundleInfoInterface $entity_type_bundle_info
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, EntityFieldManagerInterface $entity_field_manager, EntityTypeBundleInfoInterface $entity_type_bundle_info) {
    $this->entityTypeManager = $entity_type_manager;
    $this->entityFieldManager = $entity_field_manager;
    $this->entityTypeBundleInfo = $entity_type_bundle_info;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('entity_field.manager'),
      $container->get('entity_type.bundle.info')
    );
  }

  public function getMainDiagram() {
    $entity_definitions = $this->entityTypeManager->getDefinitions();
    $entities = [];
    foreach ($entity_definitions as $definition) {
      $entity = [
        'label' => $definition->getLabel(),
        'id' => $definition->id(),
        'provider' => $definition->getProvider(),
        'group' => $definition->getGroup(),
        'bundles' => [],
      ];

      if ($definition instanceof ConfigEntityTypeInterface) {
        $entity['config_properties'] = $definition->getPropertiesToExport();
      }

      $bundles = $this->entityTypeBundleInfo->getBundleInfo($definition->id());
      foreach ($bundles as $bundle_id => $bundle_label) {
        $bundle = [
          'id' => $bundle_id,
          'label' => $bundle_label['label'],
        ];

        if ($definition->isSubclassOf(FieldableEntityInterface::class)) {
          $bundle['fields'] = [];
          $fields = $this->entityFieldManager->getFieldDefinitions($definition->id(), $bundle_id);
          foreach ($fields as $field) {
            $field_storage_definition = $field->getFieldStorageDefinition();
            $bundle['fields'][] = [
              'name' => $field_storage_definition->getName(),
              'label' => $field_storage_definition->getLabel(),
              'type' => $field_storage_definition->getType(),
              'description' => $field_storage_definition->getDescription(),
              'cardinality' => $field_storage_definition->getCardinality(),
              'is_multiple' => $field_storage_definition->isMultiple()
            ];
          }
        }

        $entity['bundles'][] = $bundle;
      }

      $entities[] = $entity;
    }

    return [
      '#markup' => '<div id="erd-container"></div>',
      '#attached' => [
        'library' => ['erd/main'],
        'drupalSettings' => [
          'erd' => [
            'entities' => $entities
          ],
        ]
      ]
    ];
  }

}
