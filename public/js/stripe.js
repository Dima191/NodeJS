const stripe = Stripe('pk_test_51MSSKDK4B9cvCaD2p1hJAAwxawv64XyuDKqY6VrYQqjmEIBF6j7Q5mw2h0JtymnpDKcPFrmdabbahCHLvL1W6BvH00f97kXgRH');

export const bookTour = async tourId => {
    try {
        const session = await (await fetch(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`, {
            method: 'GET'
        })).json();
        const sessionId = session.session.id;

        await stripe.redirectToCheckout({sessionId});
    } catch (err) {
        console.log(err);
    }
}