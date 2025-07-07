import { ObjectLiteral } from 'typeorm';

/**
 * Interface to merge properties into a target entity instance.
 *
 * @template Entity - The entity class.
 */
export interface MergeInto<Entity = ObjectLiteral> {
  /**
   * Merge class properties to the given entity instance.
   *
   * The method must return the updated entity instance, not the class implementing `MergeInto`.
   * This ensures the original data remains unchanged and only the intended entity is updated.
   *
   * @param target - The entity instance.
   * @returns Merged entity instance.
   */
  merge(target: Entity): Entity;
}
