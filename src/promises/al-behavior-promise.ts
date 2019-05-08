/**
 *  AlBehaviorPromise is a simple extension of Promise that replicates the functionality provided by RxJS's BehaviorSubject.
 *  Promises already provide multicasting functionality, but it can be deucedly inconvenient to provide an inline
 *  executor, and rather obtuse to change the resolved value.
 *
 *  This class exposes the basic surface area of a Promise -- it is `then`able -- but allows the resolved value to change
 *  if necessary.
 *
 *  @author Big Red <knielsen@alertlogic.com>
 *
 *  @copyright 2019 Alert Logic, Inc.
 */

export class AlBehaviorPromise<ResultType>
{
    protected promise:Promise<ResultType>;
    protected resolver:{(result:ResultType):void};
    protected rejector:{(error:any):void};
    protected fulfilled:boolean = false;
    protected value:ResultType = null;

    constructor( initialValue:ResultType = null ) {
        if ( initialValue ) {
            this.value = initialValue;
            this.fulfilled = true;
            this.promise = Promise.resolve( initialValue );
        } else {
            this.promise = new Promise<ResultType>( ( resolve, reject ) => {
                this.resolver = resolve;
                this.rejector = reject;
            } );
        }
    }

    /**
     * Attaches a resolve/reject listener to the underlying promise.
     */
    public then( callback, error = undefined ):Promise<any> {       /* NOTE: for some reason, using `ResultType` here breaks compilation.  I have no idea why, but it makes me rather sad :| */
        return this.promise.then( callback, error );
    }

    /**
     * Resolves the underlying promise with the given value.
     */
    public resolve( result:ResultType ) {
        this.value = result;
        if ( ! this.fulfilled ) {
            this.resolver( result );
            this.fulfilled = true;
        }
        this.promise = Promise.resolve( result );       //  any further `then`s will be immediately fulfilled with the given value
    }

    /**
     * Rejects the underlying promise with the given reason.
     */
    public reject( reason:any ) {
        this.value = null;
        if ( ! this.fulfilled ) {
            this.rejector( reason );
            this.fulfilled = true;
        }
        this.promise = Promise.reject( reason );
    }

    /**
     * Resets the promise back into an unfulfilled state.
     */
    public rescind() {
        if ( this.fulfilled ) {
            this.value = null;
            this.fulfilled = false;
            this.promise = new Promise<ResultType>( ( resolve, reject ) => {
                this.resolver = resolve;
                this.rejector = reject;
            } );
        }
    }

    /**
     * Gets the last resolved value.
     */
    public getValue():ResultType {
        return this.value;
    }

    /**
     * Gets the fulfilled/pending state of the underlying promise.
     */
    public isFulfilled():boolean {
        return this.fulfilled;
    }
}
