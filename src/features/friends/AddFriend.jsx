import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  addFriend,
  updateFriendName,
  removeFriend,
  setFriends,
} from './friendsSlice';
import { getUiLabels } from '../../lib/pdfLabels';

function AddFriends() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.friends.friends);
  const uiLanguage = useSelector((state) => state.ui.language);
  const t = getUiLabels(uiLanguage);

  useEffect(() => {
    if (friends.length === 0) {
      dispatch(
        setFriends([
          { id: 1, name: '' },
          { id: 2, name: '' },
        ])
      );
    }
  }, [friends.length, dispatch]);

  const handleNameChange = (id, event) => {
    dispatch(updateFriendName({ id, name: event.target.value }));
  };

  const addFriendInput = () => {
    const newId =
      friends.length > 0 ? Math.max(...friends.map((f) => f.id)) + 1 : 1;
    dispatch(addFriend({ id: newId, name: '' }));
  };

  const removeFriendInput = (idToRemove) => {
    if (friends.length > 2) {
      dispatch(removeFriend(idToRemove));
    } else {
      alert(t.minTwoFriends);
    }
  };

  const handleDone = () => {
    const addedFriends = friends.filter((friend) => friend.name.trim() !== '');

    if (addedFriends.length === 0) {
      alert(t.enterAtLeastOneFriend);
      return;
    }

    const uniqueFriendNames = new Set(
      addedFriends.map((f) => f.name.trim().toLowerCase())
    );
    if (uniqueFriendNames.size !== addedFriends.length) {
      alert(t.duplicateFriendNames);
      return;
    }

    navigate('/split_bill');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 font-sans">
      <div className="bg-white rounded-lg shadow-md w-full max-w-xs md:max-w-sm p-4">
        <div className="flex items-center pb-4">
          <button className="text-gray-800 mr-4" onClick={() => navigate(-1)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {t.addFriendsTitle}
          </h1>
        </div>

        <div className="flex flex-col items-center py-4 overflow-y-auto max-h-[17rem] md:max-h-80">
          {friends.map((friend) => (
            <div key={friend.id} className="relative w-full mb-4">
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={friend.name}
                onChange={(e) => handleNameChange(friend.id, e)}
                className="w-full p-3 pl-4 pr-20 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-brown-500 placeholder-gray-500 text-gray-800"
                style={{ backgroundColor: '#F8F4ED', borderColor: '#D9D9D9' }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {friends.length > 2 && (
                  <button
                    onClick={() => removeFriendInput(friend.id)}
                    className="text-gray-500 hover:text-red-500 mr-2"
                    aria-label={t.removeFriend}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={addFriendInput}
            className="w-full py-3 mt-4 text-center text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-100"
            style={{ borderColor: '#D9D9D9' }}
          >
            {t.addAnotherFriend}
          </button>
          <button
            onClick={handleDone}
            className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#A08F7B' }}
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddFriends;
