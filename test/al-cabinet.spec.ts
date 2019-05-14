import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlCabinet } from '../src/utility';

describe( 'AlCabinet', () => {

    beforeEach( () => {
    } );

    describe('static methods', () => {
        it('should instantiate an AlCabinet of the correct type', () => {
            const p = AlCabinet.persistent( "persistent.cabinet" );
            expect( p.type ).to.equal( AlCabinet.PERSISTENT );
            expect( p.data ).to.eql( {} );
            expect( p.name ).to.equal( "persistent.cabinet" );

            const e = AlCabinet.ephemeral( "ephemeral.cabinet" );
            expect( e.type ).to.equal( AlCabinet.EPHEMERAL );
            expect( e.data ).to.eql( {} );
            expect( e.name ).to.equal( "ephemeral.cabinet" );

            const l = AlCabinet.local( "local.cabinet" );
            expect( l.type ).to.equal( AlCabinet.LOCAL );
            expect( l.data ).to.eql( {} );
            expect( l.name ).to.equal( "local.cabinet" );
        } );

        it( 'should always return a reference to the same cabinet for a given name', () => {
            const p = AlCabinet.persistent("test1" );
            const ref2 = AlCabinet.persistent("test1" );

            expect( p ).to.equal( ref2 );
        } );
    } );

    describe('accessor methods', () => {
        it('should allow get, set, and delete of named keys', () => {
            const cabinet = AlCabinet.local( "test" );

            expect( cabinet.get("value") ).to.equal( null );

            cabinet.set("value", true );
            cabinet.set("value2", { name: "Kevin", identity: "dumb" } );

            expect( cabinet.get("value" ) ).to.equal( true );
            expect( cabinet.exists("value" ) ).to.equal( true );

            cabinet.delete( "value" );
            expect( cabinet.get("value" ) ).to.equal( null );
            expect( cabinet.exists("value" ) ).to.equal( false );

            //  Verify default value override works
            expect( cabinet.get("doesnt_exist", "exists" ) ).to.equal( "exists" );

            //  Verify that set/undefined is the same as deletion
            cabinet.set("value2", undefined );
            expect( cabinet.exists("value2" ) ).to.equal( false );
            expect( cabinet.get("value2", null ) ).to.equal( null );
        } );

        it('should delete expired content', ( done ) => {
            const cabinet = AlCabinet.local("test2" );
            cabinet.set("value1", true, 0.01 );     //  1 centisecond lifespan
            cabinet.set("value2", true, 1 );        //  1 second lifespan
            setTimeout( () => {
                expect( cabinet.expired( "value0" ) ).to.equal( true );

                expect( cabinet.expired( "value1" ) ).to.equal( true );
                expect( cabinet.get("value1", false ) ).to.equal( false );
                expect( cabinet.exists("value1" ) ).to.equal( false );

                expect( cabinet.expired( "value2" ) ).to.equal( false );
                expect( cabinet.get("value2", false ) ).to.equal( true );
                expect( cabinet.exists("value2" ) ).to.equal( true );
                done();
            }, 50 );
        } );
    } );

    describe('synchronize and destroy methods', () => {
        it("should synchronize and destroy (ALLTHETHINGS)", () => {
            const scabinet = AlCabinet.ephemeral("testDestroySS" );
            const lcabinet = AlCabinet.persistent("testDestroyLS" );

            scabinet.set("item", { value: true, something: "else" } );
            lcabinet.set("item", { value: true, something: "else" } );

            scabinet.synchronize();
            lcabinet.synchronize();

            expect( localStorage.getItem("testDestroyLS") ).to.be.a('string' );
            expect( sessionStorage.getItem("testDestroySS") ).to.be.a('string' );

            scabinet.destroy();
            lcabinet.destroy();

            expect( sessionStorage.getItem("testDestroySS") ).to.equal( null );
            expect( localStorage.getItem("testDestroyLS") ).to.equal( null );
        } );
    } );

} );
