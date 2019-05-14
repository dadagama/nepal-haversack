import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlAPIServerError, AlResponseValidationError } from '../src/errors';

describe( 'AlAPIServerError', () => {

    it( 'should instantiate as expected', () => {
        const error = new AlAPIServerError( "Some error happened somewhere, somehow", "aims", 401 );

        expect( error.message ).to.be.a("string");
        expect( error.serviceName ).to.equal("aims" );
        expect( error.statusCode ).to.equal( 401 );
    } );

} );

describe( 'AlResponseValidationError', () => {
    it( 'should instantiate as expected', () => {
        const error = new AlResponseValidationError( "Some error happened somewhere, somehow", [ { error: true, file: '/file1', line: 120 } ] );

        expect( error.message ).to.be.a("string" );
    } );
} );
