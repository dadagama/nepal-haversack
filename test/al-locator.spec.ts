import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlLocationContext, AlLocation, AlLocationDescriptor, AlLocatorMatrix } from '../src/locator';

describe( 'AlLocatorMatrix', () => {

    const nodes:AlLocationDescriptor[] = [
        ...AlLocation.uiNode( AlLocation.OverviewUI, 'overview', 4213 ),
        ...AlLocation.uiNode( AlLocation.IncidentsUI, 'incidents', 8001 )
    ];
    let locator:AlLocatorMatrix;

    describe( 'utility methods', () => {
        beforeEach( () => {
            locator = new AlLocatorMatrix();
        } );

        it( "should escape uri patterns in the expected way", () => {
            expect( locator.escapeLocationPattern( "https://console.overview.alertlogic.com" ) ).to.equal( "^https:\\/\\/console\\.overview\\.alertlogic\\.com.*$" );
            expect( locator.escapeLocationPattern( "https://dashboards.pr-*.ui-dev.alertlogic.com" ) ).to.equal( "^https:\\/\\/dashboards\\.pr\\-[a-zA-Z0-9_]+\\.ui\\-dev\\.alertlogic\\.com.*$" );
        } );

        it( "should properly resolve URI patterns to location nodes", () => {
            locator.setLocations( nodes );

            let node = locator.getNodeByURI( "https://console.overview.alertlogic.co.uk/#/remediations-scan-status/2" );
            expect( node ).to.be.an( "object" );
            expect( node.environment ).to.equal( "production" );
            expect( node.residency ).to.equal( "EMEA" );
            expect( node.locTypeId ).to.equal( AlLocation.OverviewUI );

            node = locator.getNodeByURI( "https://incidents.pr-12.ui-dev.alertlogic.com/#/summary/12345678?aaid=12345678&locid=defender-uk-newport" );
            expect( node ).to.be.an( "object" );
            expect( node.environment ).to.equal( "integration" );
            expect( node.residency ).to.equal( undefined );
            expect( node.locTypeId ).to.equal( AlLocation.IncidentsUI );
        } );
    } );

    describe( 'given production-like location descriptors for the overview application', () => {

        beforeEach( () => {
            locator = new AlLocatorMatrix();
        } );

        it("should infer the right context information and matching sibling nodes for each acting URL", () => {
            let context = locator.getContext();
            let matching:AlLocationDescriptor = null;

            //  Default values
            expect( context.environment ).to.equal( 'production' );
            expect( context.residency ).to.equal( 'US' );

            //  Populate with nodes!
            locator.setLocations( nodes );

            //  Context inferred from default URL, which won't be recognized
            locator.setActingUri( true );
            expect( context.environment ).to.equal( "production" );
            expect( context.residency ).to.equal( "US" );

            matching = locator.getNode( AlLocation.IncidentsUI );
            expect( matching ).to.be.an( 'object' );
            expect( matching.environment ).to.equal( 'production' );
            expect( matching.residency ).to.equal( 'US' );

            //  Context inferred from UK production URL
            locator.setActingUri( 'https://console.overview.alertlogic.co.uk/#/remediations-scan-status/2' );
            context = locator.getContext();
            expect( context.environment ).to.equal( "production" );
            expect( context.residency ).to.equal( "EMEA" );

            matching = locator.getNode( AlLocation.IncidentsUI );
            expect( matching ).to.be.an( 'object' );
            expect( matching.environment ).to.equal( 'production' );
            expect( matching.residency ).to.equal( 'EMEA' );
            expect( matching.uri ).to.equal( "https://console.incidents.alertlogic.co.uk" );

            //  Context inferred from US production URL
            locator.setActingUri( 'https://console.overview.alertlogic.com/#/remediations-scan-status/2' );
            context = locator.getContext();
            expect( context.environment ).to.equal( "production" );
            expect( context.residency ).to.equal( "US" );

            matching = locator.getNode( AlLocation.IncidentsUI );
            expect( matching ).to.be.an( 'object' );
            expect( matching.environment ).to.equal( 'production' );
            expect( matching.residency ).to.equal( 'US' );
            expect( matching.uri ).to.equal( "https://console.incidents.alertlogic.com" );

            //  Context inferred from integration URL
            locator.setActingUri( 'https://console.overview.product.dev.alertlogic.com/#/remediations-scan-status/2' );
            context = locator.getContext();
            expect( context.environment ).to.equal( "integration" );
            expect( context.residency ).to.equal( "US" );

            matching = locator.getNode( AlLocation.IncidentsUI );
            expect( matching ).to.be.an( 'object' );
            expect( matching.environment ).to.equal( 'integration' );
            expect( matching.residency ).to.equal( undefined );
            expect( matching.uri ).to.equal( "https://console.incidents.product.dev.alertlogic.com" );

            //  Context inferred from local/development URL
            locator.setActingUri( 'http://localhost:4213/#/remediations-scan-status/2' );
            context = locator.getContext();
            expect( context.environment ).to.equal( "development" );
            expect( context.residency ).to.equal( "US" );

            matching = locator.getNode( AlLocation.IncidentsUI );
            expect( matching ).to.be.an( 'object' );
            expect( matching.environment ).to.equal( 'development' );
            expect( matching.residency ).to.equal( undefined );
            expect( matching.uri ).to.equal( "http://localhost:8001" );
        } );

        it("should allow nodes to be searched", () => {
            locator.setLocations( nodes );
            const matches = locator.search( loc => loc.locTypeId === AlLocation.OverviewUI ? true : false );

            const match = locator.findOne( loc => loc.locTypeId === AlLocation.OverviewUI && loc.residency === 'EMEA' ? true : false );
            expect( match ).to.be.an( 'object' );
            expect( match.locTypeId ).to.equal( AlLocation.OverviewUI );
            expect( match.residency ).to.equal( 'EMEA' );
            expect( match.environment ).to.equal( 'production' );
        } );

        it("should allow nodes to be retrieved by URI", () => {
            locator.setLocations( nodes );
            let match:AlLocationDescriptor = null;

            match = locator.getNodeByURI( "http://localhost:8001/#/some/arbitrary/path" );
            expect( match ).to.be.an( 'object' );
            expect( match.locTypeId ).to.equal( AlLocation.IncidentsUI );
            expect( match.environment ).to.equal( "development" );

            match = locator.getNodeByURI( "https://console.overview.alertlogic.co.uk/#/something/else" );
            expect( match ).to.be.an( 'object' );
            expect( match.locTypeId ).to.equal( AlLocation.OverviewUI );
            expect( match.environment ).to.equal( "production" );
            expect( match.residency ).to.equal( "EMEA" );

            match = locator.getNodeByURI( "https://somewhere.over-the.rainbow.org/#/my-page" );
            expect( match ).to.equal( null );
        } );

    } );

} );
