import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlBehaviorPromise } from '../src/promises';
import { AlStopwatch } from '../src/utility';

describe( 'AlBehaviorPromise', () => {

    let behavior = new AlBehaviorPromise<number>();
    let results:any = {};
    let resolver1 = ( value:number ) => { results.resolver1 = value; };
    let resolver2 = ( value:number ) => { results.resolver2 = value; };
    let resolver3 = ( value:number ) => { results.resolver3 = value; };

    beforeEach( () => {
        results = {
            resolver1: null,
            resolver2: null,
            resolver3: null
        };
    } );

    it( 'should be in an unfulfilled state after construction', async () => {
        expect( behavior['promise'] ).to.be.an.instanceOf( Promise );
        expect( behavior.isFulfilled() ).to.equal( false );
        expect( behavior.getValue() ).to.equal( null );
    } );

    it( 'should automatically fulfill if provided an initial value', async () => {
        behavior = new AlBehaviorPromise(42);
        expect( behavior['promise'] ).to.be.an.instanceOf( Promise );
        expect( behavior.isFulfilled() ).to.equal( true );
        expect( behavior.getValue() ).to.equal( 42 );
    } );

    it( 'should handle resolution and change to a fulfilled state', async () => {
        behavior.then( resolver1 );
        await behavior.resolve( 42 );
        expect( behavior.isFulfilled() ).to.equal( true );
        expect( behavior.getValue() ).to.equal( 42 );
        expect( results.resolver1 ).to.equal( 42 );
    } );

    it( 'should handle successive resolutions and stay in a fulfilled state with the last value', async () => {

        behavior.then( resolver1 );     //  subscribe
        await behavior.resolve( 42 );   //  received by resolver1
        await behavior.resolve( 64 );   //  change value
        behavior.then( resolver2 );     //  received by resolver2 with 64
        behavior.then( resolver3 );     //  received by resolver3 with 64
        await behavior.resolve( 91 );   //  nobody will receive this value, but wth
        expect( behavior.isFulfilled() ).to.equal( true );
        expect( behavior.getValue() ).to.equal( 91 );
        expect( results.resolver1 ).to.equal( 42 );
        expect( results.resolver2 ).to.equal( 64 );
        expect( results.resolver3 ).to.equal( 64 );
    } );

    it( "should correctly handle being 'rescinded'", async () => {
        behavior.then( resolver1 );
        await behavior.resolve( 13 );   //  resolver1 -> 13

        behavior.rescind();             //  this should put the promise back into "unfulfilled" state

        expect( behavior.isFulfilled() ).to.equal( false );
        expect( behavior.getValue() ).to.equal( null );

        behavior.then( resolver2 );

        expect( results.resolver2 ).to.equal( null );       //  no resolution yet

        behavior.then( resolver3 );
        await behavior.resolve( 16 );   //  Now, everything should be back to fulfilled again, and resolver2 and resolver3 should have received value "16"

        expect( results.resolver2 ).to.equal( 16 );
        expect( results.resolver3 ).to.equal( 16 );
        expect( behavior.isFulfilled() ).to.equal( true );
        expect( behavior.getValue() ).to.equal( 16 );

    } );

} );
