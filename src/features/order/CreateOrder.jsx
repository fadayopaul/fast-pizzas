import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import { createOrder } from "../../services/apiRestaurant";
import Button from "../../ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, getCart, getTotalCartPrice } from "../cart/cartSlice";
import { fetchAddress, getUsername } from "../user/userSlice";
import EmptyCart from "../cart/EmptyCart";
import store from "../../store";
import { formatCurrency } from "../../utils/helpers";
import { useState } from "react";

// https://uibakery.io/regex-library/phone-number
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
    str,
  );

function CreateOrder() {
  const [withPriority, setWithPriority] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function handlePriorityCheck(e) {
    setWithPriority(e.target.checked); // This will return true
  }

  function handlePhone(e) {
    setPhone(e.target.value);
  }

  function handleAddress(e) {
    setAddress(e.target.value);
  }

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const formErrors = useActionData();
  const username = useSelector(getUsername);

  const cart = useSelector(getCart);
  const totalCartPrice = useSelector(getTotalCartPrice);
  const priorityPrice = withPriority ? totalCartPrice * 0.2 : 0;
  const totalPrice = totalCartPrice + priorityPrice;

  const dispatch = useDispatch();

  if (cart.length === 0) return <EmptyCart />;

  return (
    <div className="px-4 py-6">
      <h2 className="mb-8 text-xl font-semibold">Ready to order? Let's go!</h2>

      <button onClick={() => dispatch(fetchAddress())}>Get position</button>

      <Form method="POST">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">Full Name</label>
          <input
            className="input grow"
            type="text"
            name="customer"
            defaultValue={username}
            required
          />
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">Phone number</label>
          <div className="grow">
            <input
              className="input w-full"
              type="tel"
              name="phone"
              value={phone}
              onChange={handlePhone}
              required
            />
            {formErrors?.phone && (
              <p className="mt-2 rounded-md bg-red-100 p-2 text-xs text-red-700">
                {formErrors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">Address</label>
          <div className="grow">
            <input
              className="input w-full"
              type="text"
              name="address"
              value={address}
              onChange={handleAddress}
              required
            />
          </div>
        </div>

        <div className="mb-12 flex items-center gap-5">
          <input
            className="h-6 w-6 border-none accent-yellow-400 outline-none focus:outline-none focus:ring focus:ring-yellow-400 focus:ring-offset-2"
            type="checkbox"
            name="priority"
            id="priority"
            value={withPriority}
            onChange={handlePriorityCheck}
          />
          <label className="font-medium" htmlFor="priority">
            Want to yo give your order priority?
          </label>
        </div>

        <div>
          {/* cart passed into an hidden input field, then the value is strigified */}
          <input type="hidden" name="cart" value={JSON.stringify(cart)} />

          <Button type="primary">
            {isSubmitting
              ? "Placing order..."
              : `Order now - ${formatCurrency(totalPrice)}`}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const order = {
    ...data,
    cart: JSON.parse(data.cart),
    priority: data.priority === "true",
    phone: data.phone,
    address: data.address,
  };

  // Hangling form errors
  const errors = {};
  if (!isValidPhone(order.phone))
    errors.phone =
      "Fill in your correct phone number. We might need it to contact you.";

  if (Object.keys(errors).length > 0) return errors;

  // If the form validation is correct, create a new oew order and redirect
  const newOrder = await createOrder(order);

  /* 
  Clear cart after placing order, deriving the 'clearCart' action from the store directly. 
  NOTE: - Do not over use 
  */
  store.dispatch(clearCart());

  /* Redirect the page*/
  return redirect(`/order/${newOrder.id}`);
}

export default CreateOrder;
