import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { reduce } from 'lodash';

const connect = (stores_) => (WrappedComponent) => {
    const Connect = forwardRef((props, ref) => {
        const [stores, setStores] = useState(stores_);

        useEffect(() => {
            const unsubscribeStores = reduce(stores, (acc, store) => {
                const unsubscribe = store.subscribe(() => {
                    // Just to force a re-render
                    setStores({ ...stores });
                });

                acc.push(unsubscribe);

                return acc;
            }, []);

            return () => {
                unsubscribeStores.forEach((fn) => fn());
            };
        }, [stores]);

        const renderedComponent = useMemo(
            () => <WrappedComponent ref={ ref } { ...props } { ...stores } />,
            [ref, props, stores],
        );

        return renderedComponent;
    });

    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    Connect.WrappedComponent = WrappedComponent;
    Connect.displayName = `ConnectStore(${displayName})`;

    return Connect;
};

export default connect;
