import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlBehaviorPromise } from '../src/promises';
import { AlStopwatch } from '../src/utility';

describe( 'AlStopwatch', () => {

    let stopwatch:AlStopwatch;
    let callCount:number = 0;
    const callback = () => {
        callCount++;
    };

    beforeEach( () => {
        callCount = 0;
    } );

    it("should instantiate via `later`", () => {
        stopwatch = AlStopwatch.later( callback );
        expect( stopwatch.callback ).to.equal( callback );
        expect( stopwatch.timer ).to.equal( null );
        expect( stopwatch.interval ).to.equal( 0 );
    } );

    it("should instantiate via `once`", async () => {
        stopwatch = AlStopwatch.once( callback, 100 );
        expect( stopwatch.callback ).to.equal( callback );
        expect( stopwatch.timer ).not.to.equal( null );
        expect( stopwatch.interval ).to.equal( 0 );
    } );

    it("should instantiate via `repeatedly` WITHOUT immediate executation", async () => {
        return new Promise( ( resolve, reject ) => {
            stopwatch = AlStopwatch.repeatedly( callback, 100, false );
            expect( stopwatch.callback ).to.equal( callback );
            expect( stopwatch.timer ).not.to.equal( null );
            expect( stopwatch.interval ).to.equal( 100 );

            setTimeout( () => {
                //                expect( callCount ).to.equal( 2 );      //  100ms and 200ms

                //  Validate cancelation works as expected
                stopwatch.cancel();
                expect( stopwatch.timer ).to.equal( null );

                resolve( true );
            }, 250 );

        } );
    } );

    it("should instantiate via `repeatedly` WITH immediate executation", async () => {
        return new Promise( ( resolve, reject ) => {
            stopwatch = AlStopwatch.repeatedly( callback, 100, true );
            expect( stopwatch.callback ).to.equal( callback );
            expect( stopwatch.timer ).not.to.equal( null );
            expect( stopwatch.interval ).to.equal( 100 );

            setTimeout( () => {
                //  expect( callCount ).to.equal( 3 );      //  0ms, 100ms, and 200ms
                resolve( true );
            }, 250 );

        } );
    } );

} );
