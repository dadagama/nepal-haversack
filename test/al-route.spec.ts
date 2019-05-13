import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlLocationContext, AlLocation, AlLocationDescriptor, AlLocatorMatrix } from '../src/locator';
import { AlRoutingHost, AlRouteCondition, AlRouteAction, AlRouteDefinition, AlRoute } from '../src/locator';

describe( 'AlRoute', () => {

    const actingURL = "https://console.overview.alertlogic.com/#/remediations-scan-status/2";
    const nodes:AlLocationDescriptor[] = [
        ...AlLocation.uiNode( AlLocation.OverviewUI, 'overview', 4213 ),
        ...AlLocation.uiNode( AlLocation.IncidentsUI, 'incidents', 8001 )
    ];
    let locator:AlLocatorMatrix= new AlLocatorMatrix( nodes, actingURL );
    const fakeEntitlements = {
        'a': true,
        'b': false,
        'c': true,
        'd': false
    };
    const routingHost = {
        currentUrl: actingURL,
        locator: locator,
        dispatch: ( route:AlRoute ) => {
            return true;
        },
        evaluate: ( condition:AlRouteCondition ) => {
            if ( condition.entitlements ) {
                if ( fakeEntitlements.hasOwnProperty( condition.entitlements ) ) {
                    return fakeEntitlements[condition.entitlements];
                }
            }
            return false;
        }
    };

    describe( 'given a simple menu definition', () => {

        const child1:AlRouteDefinition = {
            caption: "Child 1",
            visible: {
                entitlements: 'a'
            },
            action: {
                type: "link",
                location: AlLocation.OverviewUI,
                path: '/#/child-route-1'
            }
        };
        const child2:AlRouteDefinition = {
            caption: "Child 2",
            visible: {
                rule: 'none',
                conditions: [
                    { entitlements: 'b' },
                    { entitlements: 'd' }
                ]
            },
            action: {
                type: "link",
                location: AlLocation.IncidentsUI,
                path: '/#/child-route-2'
            }
        };
        const child3:AlRouteDefinition = {
            caption: "Child 3",
            visible: {
                rule: 'all',
                conditions: [
                    { entitlements: 'a' },
                    { entitlements: 'c' },
                    { entitlements: 'd' }           /* this is false */
                ]
            },
            action: {
                type: "link",
                location: AlLocation.IncidentsUI,
                path: '/#/child-route-3'
            }
        };

        const menuDefinition:AlRouteDefinition = {
            caption: "Test Menu",
            children: [
                {
                    caption: "Overview",
                    action: {
                        type: "link",
                        location: AlLocation.OverviewUI,
                        path: '/#/'
                    },
                    matches: [ '/#/.*' ],
                    children: [
                        child1,
                        child2,
                        child3
                    ]
                },
                {
                    caption: "Details",
                    action: {
                        type: "link",
                        location: AlLocation.IncidentsUI,
                        path: '/#/'
                    }
                }
            ]
        };

        beforeEach( () => {
        } );

        it( "should be interpreted with a correct initial state", () => {
            const route:AlRoute = new AlRoute( routingHost, menuDefinition );

            expect( route.children.length ).to.equal( 2 );
            expect( route.children[0].children.length ).to.equal( 3 );

            let route1 = route.children[0].children[0];
            let route2 = route.children[0].children[1];
            let route3 = route.children[0].children[2];

            expect( route1.href ).to.equal( 'https://console.overview.alertlogic.com/#/child-route-1' );
            expect( route1.visible ).to.equal( true );
            expect( route1.activated ).to.equal( false );

            expect( route2.href ).to.equal( 'https://console.incidents.alertlogic.com/#/child-route-2' );
            expect( route2.visible ).to.equal( true );
            expect( route2.activated ).to.equal( false );

            expect( route3.href ).to.equal( null );         // not visible?  no URL
            expect( route3.visible ).to.equal( false );
            expect( route3.activated ).to.equal( false );

        } );
    } );
} );
