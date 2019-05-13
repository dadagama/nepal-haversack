/**
 *  This is a collection of interfaces and types for cross-application routing.
 *
 *  @author McNielsen <knielsen@alertlogic.com>
 *
 *  @copyright 2017 Alert Logic Inc.
 */

import { AlLocatorMatrix } from './al-locator-service';

/**
 * Any navigation host must provide these basic functions
 */
export interface AlRoutingHost
{
    /* Exposes the current URL of the application */
    currentUrl:string;

    /* Locator matrix */
    locator: AlLocatorMatrix;

    /* Asks the host to execute a given route's action. */
    dispatch(route:AlRoute):void;

    /* Asks the host to evaluate whether a given routing condition is true or false */
    evaluate(AlRouteCondition):boolean;
}

/**
 *  Conditional expressions
 */
export interface AlRouteCondition
{
    rule?:string;                       //  must be "any", "all", or "none"
    conditions?:AlRouteCondition[];
    entitlements?:string;
}

/**
 *  The action associated with a route.  These are only the most common properties.
 */

export interface AlRouteAction
{
    /**
     *  What type of action does this route have?  This will default to 'link'
     *  but could also be 'trigger', and who knows what the future holds?
     */
    type:string;

    /**
     * If the route action is 'link' (default), these properties indicate which application (location)
     * and route (path) the link should point to.
     */
    location?:string;
    path?:string;

    /**
     * If the type of the action is 'trigger', this is the name of the event to be triggered.
     */
    trigger?:string;
}

/**
 *  This is an abstract definition for a single menu item or menu container.
 */

export interface AlRouteDefinition {
    /* A unique identifier for a route or item that can be invoked programmatically */
    id?:string;

    /* The caption of the menu item */
    caption:string;

    /* The action to perform when the menu item is clicked.     */
    action?:AlRouteAction;

    /* A condition that can be evaluated to calculate the `visible` property at any given moment */
    visible?:AlRouteCondition;

    /* Does is match patterns other than its canonical href?  If so, list of patterns relative to the action's site (only applies to action.type == link) */
    matches?:string[];

    /* Nested menu items */
    children?:AlRouteDefinition[];

    /* Behavior inflection: if this item is enabled, enable the parent item and project into its href.  This is useful for top level menu items that should direct to a child route. */
    bubble?:boolean;
}

export class AlRoute {

    /* The raw data of the route */
    definition:AlRouteDefinition;

    /* Is the menu item visible? */
    visible:boolean = true;

    /* Is the menu item currently activated/expanded?  This will allow child items to be seen. */
    activated:boolean = false;

    /* Parent menu item (if not a top level navigational slot) */
    parent:AlRoute = null;

    /* Child menu items */
    children:AlRoute[] = [];

    /* Link to the routing host, which exposes current routing context, routing parameters, and actions that influence the environment */
    host:AlRoutingHost = null;

    /* Arbitrary properties */
    properties: {[property:string]:any} = {};

    /* Cached target */
    href:string = null;

    constructor( host:AlRoutingHost, definition:AlRouteDefinition, parent:AlRoute = null ) {
        this.host       =   host;
        this.definition =   definition;
        this.parent     =   parent;
        if ( definition.children ) {
            for ( let i = 0; i < definition.children.length; i++ ) {
                this.children.push( new AlRoute( host, definition.children[i], this ) );
            }
        }
        if ( parent === null ) {
            //  This effectively performs the initial refresh/state evaluation to occur once, after the top level item has finished populating
            this.refresh( true );
        }
    }

    setProperty( propName:string, value:any ) {
        if ( value === undefined ) {
            delete this.properties[propName];
        } else {
            this.properties[propName] = value;
        }
    }

    getProperty( propName:string, defaultValue:string = null ) {
        return this.properties.hasOwnProperty( propName ) ? this.properties[propName] : defaultValue;
    }

    refresh( resolve:boolean = true ) {
        this.visible = this.definition.visible ? this.evaluateCondition( this.definition.visible ) : true;

        for ( let i = 0; i < this.children.length; i++ ) {
            let child = this.children[i];
            child.refresh( resolve );
        }

        if ( this.visible && ( resolve || this.href === null ) && this.definition.action ) {
            const action = this.definition.action;
            if ( action.type === 'link' ) {
                let node = this.host.locator.getNode( action.location );
                if ( node ) {
                    this.href = node.uri + ( action.path ? action.path : '' );
                } else {
                    console.warn(`Warning: cannot link to unknown location '${action.location}'` );
                    this.visible = false;
                }
            }
        }
        this.children.forEach( child => child.refresh( resolve ) );
    }

    evaluateCondition( condition:AlRouteCondition ):boolean {
        if ( condition.rule && condition.conditions ) {
            //  This condition is a group of other conditions -- evaluate it internally
            let total = 0;
            let passed = 0;
            condition.conditions.forEach( child => {
                total++;
                passed += this.evaluateCondition( child ) ? 1 : 0;
            } );
            if ( condition.rule === "any" ) {
                return ( passed > 0 ) ? true : false;
            } else if ( condition.rule === "all" ) {
                return ( passed === total ) ? true : false;
            } else {
                return ( passed === 0 ) ? true : false;
            }
            return false;
        } else {
            //  This condition refers to entitlement or other externally managed data -- ask the host to evaluate it.
            return this.host.evaluate( condition );
        }
    }


}
