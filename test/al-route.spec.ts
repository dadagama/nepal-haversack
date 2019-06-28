import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlLocationContext, AlLocation, AlLocationDescriptor, AlLocatorMatrix } from '../src/locator';
import { AlRoutingHost, AlRouteCondition, AlRouteAction, AlRouteDefinition, AlRoute } from '../src/locator';

describe( 'AlRoute', () => {

    const actingURL = "https://console.remediations.alertlogic.com/#/remediations-scan-status/2";
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
        },
        routeParameters: {
            accountId: "2",
            deploymentId: "1234ABCD-1234-ABCD1234"
        }
    };

    describe( 'basic functionality', () => {
        it("should allow getting and setting of properties", () => {
            const menu = new AlRoute( routingHost, {
                caption: "Test Route",
                action: {
                    type: 'link',
                    location: AlLocation.OverviewUI,
                    path: '/#/remediations-scan-status/:accountId'
                },
                properties: {}
            } );
            menu.setProperty( 'kevin', 'was-here' );
            menu.setProperty( 'terriblySmart', false );
            menu.setProperty( 'hair', null );

            expect( menu.getProperty( "kevin" ) ).to.equal( "was-here" );
            expect( menu.getProperty( "terriblySmart" ) ).to.equal( false );
            expect( menu.getProperty( "hair" ) ).to.equal( null );
            expect( menu.getProperty( "doesntExist" ) ).to.equal( null );

            menu.setProperty( 'kevin', undefined );
            expect( menu.getProperty( 'kevin' ) ).to.equal( null );

            //  Test the default value for missing properties case too
            expect( menu.getProperty( 'kevin', false ) ).to.equal( false );
        } );
    } );

    describe( 'route construction', () => {

        it( 'should evaluate route HREFs properly', () => {
            const menu = new AlRoute( routingHost, {
                caption: "Test Route",
                action: {
                    type: 'link',
                    location: AlLocation.OverviewUI,
                    path: '/#/remediations-scan-status/:accountId'
                },
                properties: {}
            } );
            menu.refresh( true );
            expect( menu.baseHREF ).to.equal( "https://console.overview.alertlogic.com" );
            expect( menu.href ).to.equal( "https://console.overview.alertlogic.com/#/remediations-scan-status/2" );
            expect( menu.visible ).to.equal( true );
        } );
        it( 'should handle invalid route HREFs properly', () => {
            const menu = new AlRoute( routingHost, {
                caption: "Test Route",
                action: {
                    type: 'link',
                    location: AlLocation.OverviewUI,
                    path: '/#/path/:notExistingVariable/something'
                },
                properties: {}
            } );
            menu.refresh( true );
            expect( menu.baseHREF ).to.equal( "https://console.overview.alertlogic.com" );
            expect( menu.href ).to.equal( "https://console.overview.alertlogic.com/#/path/:notExistingVariable/something" );
            expect( menu.visible ).to.equal( false );
        } );
        it( 'should handle invalid locations properly', () => {
            const menu = new AlRoute( routingHost, {
                caption: "Test Route",
                action: {
                    type: 'link',
                    location: "invalid:location",
                    path: '/#/path/:notExistingVariable/something'
                },
                properties: {}
            } );
            menu.refresh( false );
            expect( menu.baseHREF ).to.equal( null );
            expect( menu.href ).to.equal( null );
            expect( menu.visible ).to.equal( false );
        } );
    } );

    describe( 'activation detection', () => {
        it( "should detect exact matches!", () => {
            routingHost.currentUrl = "https://console.overview.alertlogic.com/#/path/2";
            const menu = new AlRoute( routingHost, {
                caption: "Test Route",
                action: {
                    type: 'link',
                    location: "cd17:overview",
                    path: '/#/path/:accountId'
                },
                properties: {}
            } );
            menu.refresh();

            expect( menu.href ).to.equal( "https://console.overview.alertlogic.com/#/path/2" );
            expect( menu.activated ).to.equal( true );
        } );
    } );

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
            },
            properties: {}
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
            },
            properties: {}
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
            },
            properties: {}
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
                    ],
                    properties: {}
                },
                {
                    caption: "Details",
                    action: {
                        type: "link",
                        location: AlLocation.IncidentsUI,
                        path: '/#/'
                    },
                    properties: {}
                }
            ],
            properties: {}
        };

        it( "should be interpreted with a correct initial state", () => {
            const menu:AlRoute = new AlRoute( routingHost, menuDefinition );

            expect( menu.children.length ).to.equal( 2 );
            expect( menu.children[0].children.length ).to.equal( 3 );

            let route1 = menu.children[0].children[0];
            let route2 = menu.children[0].children[1];
            let route3 = menu.children[0].children[2];

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

        it( "should activate a route with a matching URL properly", () => {

            routingHost.currentUrl = "https://console.overview.alertlogic.com/#/child-route-1";
            const menu:AlRoute = new AlRoute( routingHost, menuDefinition );

            let route1 = menu.children[0].children[0];

            expect( route1.activated ).to.equal( true );
            expect( menu.children[0].activated ).to.equal( true );
            expect( menu.activated ).to.equal( true );

        } );
    } );
} );
