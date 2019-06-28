/**
 * AlGlobalizer is a simple tool for exposing encapsulated code selectively in global scope,
 * and for ensuring that singleton instances are, in fact, singletons.
 *
 * @author Kevin Nielsen <knielsen@alertlogic.com>
 * @copyright 2019 Alert Logic, Inc.
 */

export class AlGlobalizer
{
    /**
     *  Exposes arbitrary data on a nested global property of `window`, using object merging to allow complex
     *  object composition or updates.
     *
     *  @param {string} name A period-delimited object path, e.g., `o3.state` or `al.navigation`.
     *  @param {string} data An object to be exposed at the given location.
     */
    public static expose( name:string, data:{[key:string]:any} = {} ) {
        let pathParts = name.split(".");
        let target = <any>window;
        for ( let i = 0; i < pathParts.length; i++ ) {
            let pathPart = pathParts[i];
            if ( typeof( target[pathPart] ) !== 'object' ) {
                target[pathPart] = {};
            }
            target = target[pathPart];
        }
        Object.assign( target, data );
        return target;
    }

    /**
     * Instantiates an instance of a global singleton.  This is used primarily to avoid collisions
     *
     * @param {string} name The symbolic name of the singleton.
     * @param {function} factory If the singleton hasn't already been instantiated, this method will be called to generate it.
     * @param {mixed} collisionHandling If the singleton has already been instantiated, indicates how the collision should be handled.
     *                  False will ignore the collision; true will generate a warning.  A string will cause an exception to be thrown.
     */
    public static instantiate<InstanceType>( name:string, factory:{():InstanceType}, collisionHandling:boolean|string = true ):InstanceType {
        let storage = AlGlobalizer.expose( "al.registry" );
        if ( storage.hasOwnProperty( name ) ) {
            //  Collision!
            if ( collisionHandling === true ) {
                console.warn(`Warning: the global service ${name} has already been instantiated.  This probably indicates a packaging or bundling problem of some sort.` );
            } else if ( typeof( collisionHandling ) === 'string' ) {
                throw new Error( collisionHandling );
            }
            return storage[name];
        }
        storage[name] = factory();
        return storage[name];
    }

}
