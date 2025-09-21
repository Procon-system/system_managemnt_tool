
import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import {
  FiFilter,
  FiSearch,
  FiCalendar,
  FiX,
  FiUsers,
  FiPackage,
  FiChevronDown,
  FiChevronRight,
  FiFolder
} from "react-icons/fi";
import "react-datepicker/dist/react-datepicker.css";

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside?.();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [ref, onOutside]);
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

// --- Search + Dropdown Select ---
const SearchableSelect = ({
    label,
    icon,
    placeholder,
    searchTerm,
    onSearchChange,
    items,
    onSelectItem,
    selectedItems,
    onRemoveItem,
    renderItem,
    getItemById,
    pillColorClass,
    enableDropdown = true, // kept for backwards-compat; ignored when unified=true
    groupBy,
    groupLabel,
    unified = false,
    menuTextScale = "sm",
  }) => {
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState({});
  
    useClickOutside(containerRef, () => setMenuOpen(false));
  
    const available = useMemo(
      () => items.filter((it) => !selectedItems.includes(it._id)),
      [items, selectedItems]
    );
  
    const filteredItems = useMemo(() => {
      if (!searchTerm) return available;
      const q = searchTerm.toLowerCase();
      return available.filter((item) =>
        String(typeof renderItem(item) === "string" ? renderItem(item) : "")
          .toLowerCase()
          .includes(q)
      );
    }, [available, searchTerm, renderItem]);
  
    const grouped = useMemo(() => {
      if (!groupBy) return null;
      const source = unified ? filteredItems : available;
      const groups = new Map();
      for (const it of source) {
        const key = groupBy(it) || "Other";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(it);
      }
      return Array.from(groups.entries()).sort((a, b) =>
        (groupLabel?.(a[0]) || a[0]).localeCompare(groupLabel?.(b[0]) || b[0])
      );
    }, [available, filteredItems, groupBy, groupLabel, unified]);
  
    const toggleGroup = (key) =>
      setOpenGroups((s) => ({ ...s, [key]: !s[key] }));
  
    const openMenu = () => setMenuOpen(true);
    const collectionToRender = unified ? filteredItems : available;
  
    // size classes
    const headerTextClass =
      menuTextScale === "lg" ? "text-base" : menuTextScale === "base" ? "text-sm" : "text-xs";
    const itemTextClass =
      menuTextScale === "lg" ? "text-lg" : menuTextScale === "base" ? "text-base" : "text-sm";
  
    return (
      <div className="space-y-2" ref={containerRef}>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon} {label}
        </label>
  
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onFocus={() => (unified ? openMenu() : null)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (unified) setMenuOpen(true);
            }}
            className="w-full pl-10 pr-4 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
  
          {/* Unified single-field dropdown */}
          {unified && menuOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
              {grouped ? (
                grouped.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No items</div>
                ) : (
                  <div className="py-1">
                    {grouped.map(([key, arr]) => {
                      const open = openGroups[key] ?? true;
                      const labelText = groupLabel?.(key) || key;
                      return (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => toggleGroup(key)}
                            className={classNames(
                              "w-full flex items-center justify-between px-3 py-2",
                              headerTextClass,
                              "font-semibold text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiFolder className="text-gray-500" /> {labelText}
                              <span className="ml-1 text-[10px] text-gray-400">
                                {arr.length}
                              </span>
                            </span>
                            <FiChevronRight
                              className={classNames(
                                "transition-transform duration-150",
                                open ? "rotate-90" : "rotate-0"
                              )}
                            />
                          </button>
                          {open && (
                            <div className="border-t border-gray-100">
                              {arr.map((item) => (
                                <div
                                  key={item._id}
                                  onClick={() => {
                                    onSelectItem(item._id);
                                    onSearchChange("");
                                    setMenuOpen(false);
                                    inputRef.current?.blur();
                                  }}
                                  className={classNames(
                                    "pl-10 pr-3 py-2 cursor-pointer hover:bg-gray-50",
                                    itemTextClass
                                  )}
                                >
                                  {renderItem(item)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="py-1">
                  {collectionToRender.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">No items</div>
                  ) : (
                    collectionToRender.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          onSelectItem(item._id);
                          onSearchChange("");
                          setMenuOpen(false);
                          inputRef.current?.blur();
                        }}
                        className={classNames(
                          "px-4 py-2 cursor-pointer hover:bg-gray-50",
                          itemTextClass
                        )}
                      >
                        {renderItem(item)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
  
          {/* Legacy split mode (kept for compatibility when unified=false) */}
          {!unified && enableDropdown && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border rounded-md bg-white hover:bg-gray-50"
            >
              <FiChevronDown className="opacity-70" /> Browse
            </button>
          )}
  
          {!unified && searchTerm && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      onSelectItem(item._id);
                      onSearchChange("");
                    }}
                    className={classNames(
                      "px-4 py-2 cursor-pointer hover:bg-gray-100",
                      itemTextClass
                    )}
                  >
                    {renderItem(item)}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">No matches found.</div>
              )}
            </div>
          )}
  
          {!unified && enableDropdown && menuOpen && !searchTerm && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
              {grouped ? (
                grouped.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No items</div>
                ) : (
                  <div className="py-1">
                    {grouped.map(([key, arr]) => {
                      const open = openGroups[key] ?? true;
                      const labelText = groupLabel?.(key) || key;
                      return (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => toggleGroup(key)}
                            className={classNames(
                              "w-full flex items-center justify-between px-3 py-2",
                              headerTextClass,
                              "font-semibold text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiFolder className="text-gray-500" /> {labelText}
                              <span className="ml-1 text-[10px] text-gray-400">
                                {arr.length}
                              </span>
                            </span>
                            <FiChevronRight
                              className={classNames(
                                "transition-transform duration-150",
                                open ? "rotate-90" : "rotate-0"
                              )}
                            />
                          </button>
                          {open && (
                            <div className="border-t border-gray-100">
                              {arr.map((item) => (
                                <div
                                  key={item._id}
                                  onClick={() => {
                                    onSelectItem(item._id);
                                    setMenuOpen(false);
                                  }}
                                  className={classNames(
                                    "pl-10 pr-3 py-2 cursor-pointer hover:bg-gray-50",
                                    itemTextClass
                                  )}
                                >
                                  {renderItem(item)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="py-1">
                  {available.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">No items</div>
                  ) : (
                    available.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          onSelectItem(item._id);
                          setMenuOpen(false);
                        }}
                        className={classNames(
                          "px-4 py-2 cursor-pointer hover:bg-gray-50",
                          itemTextClass
                        )}
                      >
                        {renderItem(item)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
  
        {/* Selected pills */}
        <div className="flex flex-wrap gap-2 pt-1 min-h-[30px]">
          {selectedItems.map((itemId) => {
            const item = getItemById(itemId);
            return item ? (
              <span
                key={itemId}
                className={classNames(
                  "inline-flex items-center px-2 py-1 text-xs rounded-full font-semibold",
                  pillColorClass
                )}
              >
                {renderItem(item)}
                <button
                  onClick={() => onRemoveItem(itemId)}
                  className="ml-1.5 font-bold opacity-70 hover:opacity-100"
                  aria-label="Remove"
                >
                  <FiX size={12} />
                </button>
              </span>
            ) : null;
          })}
        </div>
      </div>
    );
  };
const FilterPanel = ({
  filters,
  onApplyFilters,
  availableUsers = [],
  availableResources = []
}) => {
  const [userSearch, setUserSearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    onApplyFilters({
      dateRange: {
        start: start ? start.toISOString().split("T")[0] : "",
        end: end ? end.toISOString().split("T")[0] : ""
      }
    });
  };

  const setQuickDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    if (range === "last7") start.setDate(end.getDate() - 7);
    if (range === "thisMonth") start.setDate(1);
    onApplyFilters({
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0]
      }
    });
  };

  const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
  const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

  const addUser = (userId) => {
    if (userId && !filters.userIds.includes(userId)) {
      onApplyFilters({ userIds: [...filters.userIds, userId] });
      setUserSearch("");
    }
  };
  const removeUser = (userId) => {
    onApplyFilters({ userIds: filters.userIds.filter((id) => id !== userId) });
  };

  const addResource = (resourceId) => {
    if (resourceId && !filters.resourceIds.includes(resourceId)) {
      onApplyFilters({ resourceIds: [...filters.resourceIds, resourceId] });
      setResourceSearch("");
    }
  };
  const removeResource = (resourceId) => {
    onApplyFilters({ resourceIds: filters.resourceIds.filter((id) => id !== resourceId) });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <FiFilter className="h-6 w-6 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FiCalendar /> Date Range
          </label>
          <div className="relative">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              isClearable={true}
              placeholderText="Select a date range"
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 text-xs">
            <button
              onClick={() => setQuickDateRange("last7")}
              className="text-blue-600 hover:underline"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setQuickDateRange("thisMonth")}
              className="text-blue-600 hover:underline"
            >
              This Month
            </button>
          </div>
        </div>

        <SearchableSelect
  label="Filter by User"
  icon={<FiUsers/>}
  placeholder="Search users…"
  searchTerm={userSearch}
  onSearchChange={setUserSearch}
  items={availableUsers}
  onSelectItem={addUser}
  selectedItems={filters.userIds}
  onRemoveItem={removeUser}
  renderItem={(u) => `${u.first_name} ${u.last_name}`}
  getItemById={(id) => availableUsers.find((u) => u._id === id)}
  pillColorClass="bg-blue-100 text-blue-800"
  unified
  menuTextScale="base"        
/>

        <SearchableSelect
          label="Filter by Resource"
          icon={<FiPackage />}
          placeholder="Search resources..."
          searchTerm={resourceSearch}
          onSearchChange={setResourceSearch}
          items={availableResources}
          onSelectItem={addResource}
          selectedItems={filters.resourceIds}
          onRemoveItem={removeResource}
          renderItem={(resource) => resource.displayName}
          getItemById={(resourceId) =>
            availableResources.find((r) => r._id === resourceId)
          }
          pillColorClass="bg-green-100 text-green-800"
          groupBy={(r) => r?.type?.name || "Uncategorized"}
          groupLabel={(key) => key}
          unified
          menuTextScale="base"
        />
      </div>
    </div>
  );
};

export default FilterPanel;
export { FilterPanel, SearchableSelect };
