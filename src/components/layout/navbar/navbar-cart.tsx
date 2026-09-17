import {CartIcon} from './cart-icon';
import {query} from '@/lib/vendure/api';
import {GetActiveOrderQuery} from '@/lib/vendure/queries';

/**
 * Cart badge in the header. It renders on every route, so a failing shop API
 * must degrade to an empty cart instead of taking the whole page down.
 */
export async function NavbarCart() {
    let cartItemCount = 0;

    try {
        const orderResult = await query(GetActiveOrderQuery, undefined, {
            useAuthToken: true,
            tags: ['cart'],
        });
        cartItemCount = orderResult.data.activeOrder?.totalQuantity || 0;
    } catch (error) {
        console.warn('NavbarCart: could not load the active order, showing an empty cart', error);
    }

    return <CartIcon cartItemCount={cartItemCount} />;
}
